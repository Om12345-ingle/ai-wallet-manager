import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini if key is present
const geminiKey = process.env.GEMINI_API_KEY || "";
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

// ── Regex-based fast parser (runs first, no API cost) ─────────────────────────
function parseCommandFast(command: string): any | null {
  const cmd = command.trim().toLowerCase();

  if (/^(hi+|hey+|hello+|howdy|sup|yo|hiya|greetings|good (morning|evening|afternoon))[\s!?.]*$/i.test(cmd))
    return { action: 'greeting' };

  if (/^(help|what can you do|commands?|options|menu|what do you do)[\s!?.]*$/i.test(cmd))
    return { action: 'help' };

  if (/\bbalance\b|how much (do i have|xlm|money)|what.?s my (balance|xlm|funds?)|check.?my.?balance|show.?my.?balance/.test(cmd))
    return { action: 'balance' };

  if (/\bportfolio\b|my assets|all.?my.?assets|\bholdings\b|what do i own/.test(cmd))
    return { action: 'get_portfolio' };

  if (/\bhistory\b|recent transactions?|show.?my.?transactions?|transaction list/.test(cmd))
    return { action: 'history' };

  if (/swap history|my swaps?|recent swaps?/.test(cmd))
    return { action: 'get_swap_history' };

  if (/\bprice[s]?\b|current rates?|how much is (xlm|usdc|eurc)|asset prices?/.test(cmd))
    return { action: 'get_asset_prices' };

  if (/\btrustlines?\b/.test(cmd))
    return { action: 'check_trustlines' };

  if (/unfreeze.*(wallet|account)|unlock.*(wallet|account)/.test(cmd))
    return { action: 'unfreeze_wallet', requiresConfirmation: true };

  if (/freeze.*(wallet|account)|lock everything|emergency (freeze|lock)/.test(cmd))
    return { action: 'freeze_wallet', requiresConfirmation: true };

  if (/spending (info|limits?|status)|check (spending|limits?)|wallet status|security status/.test(cmd))
    return { action: 'get_spending_info' };

  if (/\bstatus\b/.test(cmd))
    return { action: 'get_spending_info' };

  const dailyMatch = cmd.match(/set.?daily.?limit.?(?:to\s*)?(\d+(?:\.\d+)?)|daily.?limit\s+(\d+(?:\.\d+)?)/);
  if (dailyMatch) return { action: 'set_daily_limit', limit: parseFloat(dailyMatch[1] || dailyMatch[2]) };

  const monthlyMatch = cmd.match(/set.?monthly.?limit.?(?:to\s*)?(\d+(?:\.\d+)?)|monthly.?limit\s+(\d+(?:\.\d+)?)/);
  if (monthlyMatch) return { action: 'set_monthly_limit', limit: parseFloat(monthlyMatch[1] || monthlyMatch[2]) };

  const calcSwap = cmd.match(/calc(?:ulate)?\s+swap\s+(\d+(?:\.\d+)?)\s+(xlm|usdc|eurc|aqua|ybx)\s+(?:to|for|into)\s+(xlm|usdc|eurc|aqua|ybx)/i);
  if (calcSwap) return { action: 'calculate_swap', amount: parseFloat(calcSwap[1]), fromAsset: calcSwap[2].toUpperCase(), toAsset: calcSwap[3].toUpperCase() };

  const swapMatch = cmd.match(/(?:swap|trade|convert|exchange)\s+(\d+(?:\.\d+)?)\s+(xlm|usdc|eurc|aqua|ybx)\s+(?:to|for|into)\s+(xlm|usdc|eurc|aqua|ybx)/i);
  if (swapMatch) return { action: 'swap_tokens', amount: parseFloat(swapMatch[1]), fromAsset: swapMatch[2].toUpperCase(), toAsset: swapMatch[3].toUpperCase(), requiresConfirmation: true };

  const sendAddr = cmd.match(/send\s+(\d+(?:\.\d+)?)\s*(xlm|usdc|eurc)?\s*(?:to\s+)?(g[a-z0-9]{55})/i);
  if (sendAddr) return { action: 'send', amount: parseFloat(sendAddr[1]), fromAsset: (sendAddr[2] || 'XLM').toUpperCase(), recipient: sendAddr[3].toUpperCase(), requiresConfirmation: true };

  const sendContact = cmd.match(/send\s+(\d+(?:\.\d+)?)\s*(xlm|usdc|eurc)?\s+(?:to\s+)?([a-z][a-z0-9 ]{1,20})$/i);
  if (sendContact && !/^g[a-z0-9]{55}$/i.test(sendContact[3].trim()))
    return { action: 'send_to_contact', amount: parseFloat(sendContact[1]), fromAsset: (sendContact[2] || 'XLM').toUpperCase(), contactName: sendContact[3].trim().toLowerCase(), requiresConfirmation: true };

  const saveContract = cmd.match(/save\s+(g[a-z0-9]{55})\s+as\s+([a-z][a-z0-9 ]+)\s+(?:to contract|on blockchain|on chain)/i);
  if (saveContract) return { action: 'save_contact_to_contract', recipient: saveContract[1].toUpperCase(), contactName: saveContract[2].trim().toLowerCase() };

  const saveLocal = cmd.match(/save\s+(g[a-z0-9]{55})\s+as\s+([a-z][a-z0-9 ]+)/i);
  if (saveLocal) return { action: 'save_contact', recipient: saveLocal[1].toUpperCase(), contactName: saveLocal[2].trim().toLowerCase() };

  if (/list contacts?|show contacts?|my contacts?|view contacts?/.test(cmd))
    return { action: 'list_contacts' };

  return null;
}

// ── Local heuristic NLP-based parser (runs offline/no API keys fallback) ──────
function parseCommandHeuristics(command: string, contacts: string[]): any | null {
  const cmd = command.trim().toLowerCase();

  // Extract number if any
  const numbers = cmd.match(/\b\d+(?:\.\d+)?\b/);
  const amount = numbers ? parseFloat(numbers[0]) : null;

  // Extract assets
  const assetRegex = /\b(xlm|usdc|eurc|aqua|ybx|stellar|lumens|dollars?|euros?)\b/gi;
  const assetsFound = cmd.match(assetRegex);
  const normalizedAssets = assetsFound ? assetsFound.map(a => {
    const asset = a.toLowerCase();
    if (asset === 'stellar' || asset === 'lumens') return 'XLM';
    if (asset === 'dollars' || asset === 'usd' || asset === 'dollar') return 'USDC';
    if (asset === 'euros' || asset === 'eur' || asset === 'euro') return 'EURC';
    return asset.toUpperCase();
  }) : [];

  // Extract address
  const addressMatch = cmd.match(/\b(g[a-z0-9]{55})\b/i);
  const address = addressMatch ? addressMatch[1].toUpperCase() : null;

  // Extract contact name candidate from command
  let contactName: string | null = null;
  const toMatch = cmd.match(/\bto\s+([a-z][a-z0-9 ]{1,20})\b/i);
  if (toMatch) {
    contactName = toMatch[1].trim();
    if (normalizedAssets.includes(contactName.toUpperCase()) || ['wallet', 'account', 'contract', 'blockchain', 'chain'].includes(contactName)) {
      contactName = null;
    }
  }

  const asMatch = cmd.match(/\bas\s+([a-z][a-z0-9 ]{1,20})\b/i);
  if (asMatch) {
    contactName = asMatch[1].trim();
    if (normalizedAssets.includes(contactName.toUpperCase())) contactName = null;
  }

  if (!contactName && contacts.length > 0) {
    for (const c of contacts) {
      if (cmd.includes(c.toLowerCase())) {
        contactName = c.toLowerCase();
        break;
      }
    }
  }

  // Classification logic
  if (/\b(send|transfer|pay|give|wire|ship)\b/.test(cmd)) {
    if (amount !== null) {
      const fromAsset = normalizedAssets[0] || 'XLM';
      if (address) {
        return { action: 'send', amount, fromAsset, recipient: address, requiresConfirmation: true };
      }
      if (contactName) {
        return { action: 'send_to_contact', amount, fromAsset, contactName, requiresConfirmation: true };
      }
      const genericTo = cmd.match(/\bto\s+([a-z0-9]+)\b/i);
      if (genericTo) {
        return { action: 'send_to_contact', amount, fromAsset, contactName: genericTo[1], requiresConfirmation: true };
      }
    }
  }

  if (/\b(swap|trade|convert|exchange|calculate|calc)\b/.test(cmd)) {
    if (amount !== null && normalizedAssets.length >= 2) {
      const fromAsset = normalizedAssets[0];
      const toAsset = normalizedAssets[1];
      const isCalc = /\b(calculate|calc|estimate|check rate)\b/.test(cmd);
      if (isCalc) {
        return { action: 'calculate_swap', amount, fromAsset, toAsset };
      } else {
        return { action: 'swap_tokens', amount, fromAsset, toAsset, requiresConfirmation: true };
      }
    }
  }

  if (/\b(save|add|store)\b/.test(cmd) && address) {
    const isContract = /\b(contract|chain|blockchain|ledger)\b/.test(cmd);
    const name = contactName || 'new_contact';
    if (isContract) {
      return { action: 'save_contact_to_contract', recipient: address, contactName: name };
    } else {
      return { action: 'save_contact', recipient: address, contactName: name };
    }
  }

  if (/\b(limit|allowance|cap)\b/.test(cmd)) {
    const isDaily = /\b(daily|day)\b/.test(cmd);
    const isMonthly = /\b(monthly|month)\b/.test(cmd);
    if (amount !== null) {
      if (isMonthly) {
        return { action: 'set_monthly_limit', limit: amount };
      }
      return { action: 'set_daily_limit', limit: amount };
    }
    return { action: 'get_spending_info' };
  }

  if (/\b(freeze|lock|block)\b/.test(cmd)) {
    return { action: 'freeze_wallet', requiresConfirmation: true };
  }

  if (/\b(unfreeze|unlock|unblock|activate)\b/.test(cmd)) {
    return { action: 'unfreeze_wallet', requiresConfirmation: true };
  }

  if (/\b(portfolio|assets|holdings|funds|own|balance|money|wallet|xlm)\b/.test(cmd)) {
    if (/\b(balance|much money|much xlm|funds)\b/.test(cmd)) {
      return { action: 'balance' };
    }
    return { action: 'get_portfolio' };
  }

  if (/\b(history|transactions|past|recent|activity)\b/.test(cmd)) {
    if (/\b(swap|trade)\b/.test(cmd)) {
      return { action: 'get_swap_history' };
    }
    return { action: 'history' };
  }

  if (/\b(price|rate|market|value|worth|cost)\b/.test(cmd)) {
    return { action: 'get_asset_prices' };
  }

  if (/\b(trustline|trustlines|establish|trust)\b/.test(cmd)) {
    return { action: 'check_trustlines' };
  }

  if (/\b(contacts?|friends?|people)\b/.test(cmd)) {
    if (/\b(list|show|view|all)\b/.test(cmd)) {
      return { action: 'list_contacts' };
    }
  }

  if (/\b(help|commands|options|menu|info|guide)\b/.test(cmd)) {
    return { action: 'help' };
  }

  if (/\b(hi|hello|hey|yo|greetings|welcome|sup)\b/.test(cmd)) {
    return { action: 'greeting' };
  }

  return null;
}

// ── Multi-LLM Provider API Query functions ────────────────────────────────────

const systemPromptBase = `You are an AI assistant for a Stellar blockchain wallet. Parse the user's message and return ONLY valid JSON.
Return one of these JSON objects:
For balance: {"action":"balance"}
For portfolio: {"action":"get_portfolio"}
For transaction history: {"action":"history"}
For asset prices: {"action":"get_asset_prices"}
For swap history: {"action":"get_swap_history"}
For trustlines: {"action":"check_trustlines"}
For spending/security status: {"action":"get_spending_info"}
For freeze wallet: {"action":"freeze_wallet","requiresConfirmation":true}
For unfreeze wallet: {"action":"unfreeze_wallet","requiresConfirmation":true}
For set daily limit: {"action":"set_daily_limit","limit":NUMBER}
For set monthly limit: {"action":"set_monthly_limit","limit":NUMBER}
For swap tokens: {"action":"swap_tokens","amount":NUMBER,"fromAsset":"XLM","toAsset":"USDC","requiresConfirmation":true}
For send to address: {"action":"send","amount":NUMBER,"fromAsset":"XLM","recipient":"G...","requiresConfirmation":true}
For send to contact name: {"action":"send_to_contact","amount":NUMBER,"fromAsset":"XLM","contactName":"name","requiresConfirmation":true}
For save contact: {"action":"save_contact","recipient":"G...","contactName":"name"}
For list contacts: {"action":"list_contacts"}
For greeting: {"action":"greeting"}
For help: {"action":"help"}
For calculate swap: {"action":"calculate_swap","amount":NUMBER,"fromAsset":"XLM","toAsset":"USDC"}

Asset codes: XLM, USDC, EURC, AQUA, YBX
Aliases: stellar/lumens=XLM, dollars/usd=USDC, euros/eur=EURC

If you cannot determine the intent, return: {"action":"unknown","message":"brief explanation"}`;

async function parseWithGemini(command: string, contacts: string[]): Promise<any> {
  if (!genAI) throw new Error("Gemini not configured");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const contactList = contacts.length > 0 ? `\nKnown contacts: ${contacts.join(', ')}` : '';
  const prompt = `${systemPromptBase}\n\nUser message: "${command}"${contactList}\n\nReturn ONLY the JSON object, no markdown, no explanation.`;
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(text);
}

async function parseWithOpenAI(command: string, contacts: string[], apiKey: string): Promise<any> {
  const contactList = contacts.length > 0 ? `\nKnown contacts: ${contacts.join(', ')}` : '';
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPromptBase },
        { role: "user", content: `User message: "${command}"${contactList}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content.trim();
  return JSON.parse(content);
}

async function parseWithGroq(command: string, contacts: string[], apiKey: string): Promise<any> {
  const contactList = contacts.length > 0 ? `\nKnown contacts: ${contacts.join(', ')}` : '';
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPromptBase },
        { role: "user", content: `User message: "${command}"${contactList}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content.trim();
  return JSON.parse(content);
}

async function parseWithOllama(command: string, contacts: string[], modelName: string): Promise<any> {
  const contactList = contacts.length > 0 ? `\nKnown contacts: ${contacts.join(', ')}` : '';
  const res = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: systemPromptBase },
        { role: "user", content: `User message: "${command}"${contactList}` }
      ],
      format: "json",
      stream: false
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data.message.content.trim();
  return JSON.parse(content);
}

// ── Main API Route POST handler ───────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { command, contacts = [], balance = "0", spendingInfo = null } = await request.json();

    if (!command?.trim()) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    let parseResult: any = null;
    let providerUsed = '';

    // 1. Try fast regex parser first (immediate, no cost)
    const fast = parseCommandFast(command);
    if (fast) {
      console.log(`[AI Parser] Fast Regex match:`, fast.action);
      parseResult = fast;
      providerUsed = 'regex';
    } else {
      // 2. Try configured LLM providers in waterfall sequence
      try {
        if (process.env.OPENAI_API_KEY) {
          console.log(`[AI Parser] Attempting OpenAI...`);
          parseResult = await parseWithOpenAI(command, contacts.map((c: any) => typeof c === 'string' ? c : c.name), process.env.OPENAI_API_KEY);
          providerUsed = 'openai';
        } else if (process.env.GROQ_API_KEY) {
          console.log(`[AI Parser] Attempting Groq...`);
          parseResult = await parseWithGroq(command, contacts.map((c: any) => typeof c === 'string' ? c : c.name), process.env.GROQ_API_KEY);
          providerUsed = 'groq';
        } else if (process.env.GEMINI_API_KEY && genAI) {
          console.log(`[AI Parser] Attempting Gemini...`);
          parseResult = await parseWithGemini(command, contacts.map((c: any) => typeof c === 'string' ? c : c.name));
          providerUsed = 'gemini';
        } else if (process.env.OLLAMA_MODEL) {
          console.log(`[AI Parser] Attempting local Ollama (${process.env.OLLAMA_MODEL})...`);
          parseResult = await parseWithOllama(command, contacts.map((c: any) => typeof c === 'string' ? c : c.name), process.env.OLLAMA_MODEL);
          providerUsed = 'ollama';
        }
      } catch (llmError: any) {
        console.error(`[AI Parser] LLM Provider error (${providerUsed || 'unknown'}):`, llmError.message);
      }

      // 3. Heuristic / Local NLP Fallback (Runs if no LLM configured OR LLM call failed)
      if (!parseResult) {
        console.log(`[AI Parser] Fallback: running local heuristic parser...`);
        parseResult = parseCommandHeuristics(command, contacts.map((c: any) => typeof c === 'string' ? c : c.name));
        providerUsed = 'local-heuristics';
      }
    }

    // 4. Return result if classified successfully
    if (parseResult && parseResult.action !== 'unknown') {
      console.log(`[AI Parser] Success using ${providerUsed}:`, parseResult.action);
      
      const responsePayload: any = {
        ...parseResult,
        confidence: providerUsed === 'local-heuristics' ? 0.8 : (providerUsed === 'regex' ? 1.0 : 0.9),
        source: providerUsed
      };

      // Inject Guardrail analysis if transaction requires confirmation
      if (parseResult.requiresConfirmation) {
        // Normalize contacts
        const normalizedContacts = contacts.map((c: any) => {
          if (typeof c === 'string') return { name: c.toLowerCase(), address: '' };
          return { name: c.name?.toLowerCase() || '', address: c.address || '' };
        });

        const checks = [];
        const numAmount = parseResult.amount ? parseFloat(parseResult.amount) : 0;
        const numBalance = balance ? parseFloat(balance) : 0;

        // 1. Wallet Frozen Check
        if (spendingInfo) {
          if (spendingInfo.isFrozen) {
            checks.push({
              name: 'Wallet Status',
              passed: false,
              status: 'fail',
              msg: '🚫 Wallet is currently frozen. Outgoing transactions are blocked.'
            });
          } else {
            checks.push({
              name: 'Wallet Status',
              passed: true,
              status: 'pass',
              msg: '✅ Wallet is active and secure.'
            });
          }
        }

        // 2. Balance Verification
        if (parseResult.action === 'send' || parseResult.action === 'send_to_contact' || parseResult.action === 'swap_tokens') {
          if (numAmount > numBalance) {
            checks.push({
              name: 'Funds Check',
              passed: false,
              status: 'fail',
              msg: `❌ Insufficient balance. Trying to use ${numAmount} XLM but you only have ${numBalance} XLM.`
            });
          } else if (numAmount > numBalance * 0.5) {
            checks.push({
              name: 'Funds Check',
              passed: true,
              status: 'warn',
              msg: `⚠️ High Exposure: This transaction uses ${Math.round((numAmount / numBalance) * 100)}% of your total balance.`
            });
          } else {
            checks.push({
              name: 'Funds Check',
              passed: true,
              status: 'pass',
              msg: '✅ Sufficient funds available.'
            });
          }
        }

        // 3. Contact Safety Verification
        if (parseResult.action === 'send') {
          const matched = normalizedContacts.find((c: any) => c.address === parseResult.recipient);
          if (matched) {
            checks.push({
              name: 'Recipient Identity',
              passed: true,
              status: 'pass',
              msg: `✅ Verified: Recipient is in your contacts as "${matched.name}".`
            });
          } else {
            checks.push({
              name: 'Recipient Identity',
              passed: true,
              status: 'warn',
              msg: '⚠️ Unknown Address: This recipient is not in your saved contacts list.'
            });
          }
        } else if (parseResult.action === 'send_to_contact') {
          const matched = normalizedContacts.find((c: any) => c.name === parseResult.contactName);
          if (matched) {
            checks.push({
              name: 'Recipient Identity',
              passed: true,
              status: 'pass',
              msg: `✅ Verified: Contact "${parseResult.contactName}" exists.`
            });
          } else {
            checks.push({
              name: 'Recipient Identity',
              passed: false,
              status: 'warn',
              msg: `⚠️ Contact Not Found: "${parseResult.contactName}" is not saved. Ensure correct spelling.`
            });
          }
        }

        // 4. Daily Spending Limit Check
        if (spendingInfo && (parseResult.action === 'send' || parseResult.action === 'send_to_contact' || parseResult.action === 'swap_tokens')) {
          const remaining = spendingInfo.dailyLimit - spendingInfo.dailySpent;
          if (numAmount > remaining) {
            checks.push({
              name: 'Spending Limit',
              passed: false,
              status: 'fail',
              msg: `🚫 Exceeds Daily Limit: Daily limit remaining is ${remaining.toFixed(2)} XLM (Tried ${numAmount} XLM).`
            });
          } else {
            checks.push({
              name: 'Spending Limit',
              passed: true,
              status: 'pass',
              msg: `✅ Within Daily Limit: ${remaining.toFixed(2)} XLM remaining for today.`
            });
          }
        }

        // Generate conversational ELI5 explanation
        let eli5 = '';
        if (genAI && providerUsed === 'gemini') {
          try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `You are a helpful Stellar wallet assistant. Write a short, friendly, reassuring explanation in one sentence of this parsed transaction action: ${JSON.stringify(parseResult)}. E.g., "You are about to swap 10 XLM into USDC." or "This will trigger a lockdown on your wallet."`;
            const result = await model.generateContent(prompt);
            eli5 = result.response.text().trim();
          } catch (e) {
            console.warn("Failed to generate ELI5 with Gemini:", e);
          }
        }

        if (!eli5) {
          // Template fallbacks
          if (parseResult.action === 'send' || parseResult.action === 'send_to_contact') {
            const recipientStr = parseResult.contactName ? parseResult.contactName : (parseResult.recipient ? `${parseResult.recipient.slice(0, 8)}...` : 'recipient');
            eli5 = `You are sending ${numAmount} ${parseResult.fromAsset || 'XLM'} to ${recipientStr}. It will confirm on-chain in seconds.`;
          } else if (parseResult.action === 'swap_tokens') {
            eli5 = `You are swapping ${numAmount} ${parseResult.fromAsset} for ${parseResult.toAsset}. This executes immediately on the Stellar DEX.`;
          } else if (parseResult.action === 'freeze_wallet') {
            eli5 = `This will temporarily freeze your wallet. Outgoing transfers will be blocked until unfrozen.`;
          } else if (parseResult.action === 'unfreeze_wallet') {
            eli5 = `This will unlock your wallet and restore normal transaction permissions.`;
          } else {
            eli5 = `You are confirming a ${parseResult.action.replace('_', ' ')} action.`;
          }
        }

        responsePayload.guardrails = {
          eli5,
          fee: '0.00001 XLM',
          speed: '~3-5 seconds',
          checks
        };
      }

      return NextResponse.json(responsePayload);
    }

    // 5. If completely unknown or unparseable, return suggestions
    const suggestions = [
      '"What\'s my balance?"',
      '"Show my portfolio"',
      '"Swap 100 XLM to USDC"',
      '"Send 5 XLM to Alice"',
      '"Freeze my wallet"',
      '"Set daily limit to 500 XLM"',
      '"List contacts"',
      '"Help"'
    ];

    console.log(`[AI Parser] Command could not be parsed: "${command}"`);
    return NextResponse.json({
      error: parseResult?.message || `I didn't understand "${command}"`,
      suggestions
    }, { status: 400 });

  } catch (error: any) {
    console.error(`[AI Parser] Route handler error:`, error);
    return NextResponse.json({ error: error.message || 'Parse error' }, { status: 500 });
  }
}
