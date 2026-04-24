import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

  const sendAddr = cmd.match(/send\s+(\d+(?:\.\d+)?)\s*(xlm|usdc|eurc)?\s*(?:to\s+)?(g[a-z0-9]{54})/i);
  if (sendAddr) return { action: 'send', amount: parseFloat(sendAddr[1]), fromAsset: (sendAddr[2] || 'XLM').toUpperCase(), recipient: sendAddr[3], requiresConfirmation: true };

  const sendContact = cmd.match(/send\s+(\d+(?:\.\d+)?)\s*(xlm|usdc|eurc)?\s+(?:to\s+)?([a-z][a-z0-9 ]{1,20})$/i);
  if (sendContact && !/^g[a-z0-9]{54}$/i.test(sendContact[3].trim()))
    return { action: 'send_to_contact', amount: parseFloat(sendContact[1]), fromAsset: (sendContact[2] || 'XLM').toUpperCase(), contactName: sendContact[3].trim().toLowerCase(), requiresConfirmation: true };

  const saveContract = cmd.match(/save\s+(g[a-z0-9]{54})\s+as\s+([a-z][a-z0-9 ]+)\s+(?:to contract|on blockchain|on chain)/i);
  if (saveContract) return { action: 'save_contact_to_contract', recipient: saveContract[1], contactName: saveContract[2].trim().toLowerCase() };

  const saveLocal = cmd.match(/save\s+(g[a-z0-9]{54})\s+as\s+([a-z][a-z0-9 ]+)/i);
  if (saveLocal) return { action: 'save_contact', recipient: saveLocal[1], contactName: saveLocal[2].trim().toLowerCase() };

  if (/list contacts?|show contacts?|my contacts?|view contacts?/.test(cmd))
    return { action: 'list_contacts' };

  return null;
}

// ── Gemini AI parser (fallback for anything the regex misses) ─────────────────
async function parseWithGemini(command: string, contacts: string[]): Promise<any> {
  if (!process.env.GEMINI_API_KEY) throw new Error("No Gemini key");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const contactList = contacts.length > 0 ? `\nKnown contacts: ${contacts.join(', ')}` : '';

  const prompt = `You are an AI assistant for a Stellar blockchain wallet. Parse the user's message and return ONLY valid JSON.

User message: "${command}"${contactList}

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

If you cannot determine the intent, return: {"action":"unknown","message":"brief explanation"}

Return ONLY the JSON object, no markdown, no explanation.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(text);
}

export async function POST(request: NextRequest) {
  try {
    const { command, contacts = [] } = await request.json();

    if (!command?.trim()) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    // 1. Try fast regex parser first
    const fast = parseCommandFast(command);
    if (fast) {
      return NextResponse.json({ ...fast, confidence: 1.0 });
    }

    // 2. Try Gemini AI for anything the regex missed
    try {
      const aiResult = await parseWithGemini(command, contacts);

      if (aiResult.action === 'unknown') {
        return NextResponse.json({
          error: aiResult.message || `I didn't understand "${command}"`,
          suggestions: [
            '"What\'s my balance?"',
            '"Show my portfolio"',
            '"Swap 10 XLM to USDC"',
            '"Send 5 XLM to G..." or "Send 5 XLM to Alice"',
            '"Freeze my wallet"',
            '"Set daily limit to 500 XLM"',
            '"List contacts"',
            '"Help"'
          ]
        }, { status: 400 });
      }

      return NextResponse.json({ ...aiResult, confidence: 0.9 });
    } catch (aiError) {
      // 3. Both failed — return helpful error
      return NextResponse.json({
        error: `I didn't understand "${command}"`,
        suggestions: [
          '"What\'s my balance?"',
          '"Show my portfolio"',
          '"Swap 10 XLM to USDC"',
          '"Send 5 XLM to Alice"',
          '"Freeze my wallet"',
          '"Set daily limit to 500 XLM"',
          '"List contacts"',
          '"Help"'
        ]
      }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Parse error' }, { status: 500 });
  }
}
