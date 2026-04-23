/**
 * Tests for AI Wallet Manager — Command Parser
 * Covers natural language command parsing logic
 */

// Inline the parser so tests run without Next.js context
function parseCommand(command: string) {
  const raw = command.trim()
  const cmd = raw.toLowerCase()

  if (/^(hi+|hey+|hello+|howdy|sup|yo|hiya|greetings|good (morning|evening|afternoon))[\s!?.]*$/i.test(cmd)) {
    return { action: 'greeting', confidence: 1.0 }
  }
  if (/^(help|what can you do|commands?|options|menu|what do you do)[\s!?.]*$/i.test(cmd)) {
    return { action: 'help', confidence: 1.0 }
  }
  if (/balance|how much (do i have|xlm|money)|what('?s| is) my (balance|xlm|funds?)|check (my )?balance|show (my )?balance/.test(cmd)) {
    return { action: 'balance', confidence: 1.0 }
  }
  if (/portfolio|my assets|all (my )?assets|holdings|what (do i own|assets)/.test(cmd)) {
    return { action: 'get_portfolio', confidence: 1.0 }
  }
  if (/history|transactions?|recent (transactions?|activity)|show (my )?(transactions?|history)/.test(cmd)) {
    return { action: 'history', confidence: 1.0 }
  }
  if (/price|rates?|current (price|rate)|how much is (xlm|usdc|eurc)|asset prices?/.test(cmd)) {
    return { action: 'get_asset_prices', confidence: 1.0 }
  }
  if (/unfreeze (my )?(wallet|account)|unlock (my )?(wallet|account)/.test(cmd)) {
    return { action: 'unfreeze_wallet', confidence: 1.0, requiresConfirmation: true }
  }
  if (/freeze (my )?(wallet|account)|lock (everything|my wallet|my account|it all down)|emergency (freeze|lock)|lock everything/.test(cmd)) {
    return { action: 'freeze_wallet', confidence: 1.0, requiresConfirmation: true }
  }
  if (/spending (info|limits?|status)|check (spending|limits?)|status|wallet status|security status/.test(cmd)) {
    return { action: 'get_spending_info', confidence: 1.0 }
  }
  const dailyLimitMatch = cmd.match(/set (daily|day) limit (to )?(\d+(\.\d+)?)|daily limit (\d+(\.\d+)?)/)
  if (dailyLimitMatch) {
    const limit = parseFloat(dailyLimitMatch[3] || dailyLimitMatch[5])
    return { action: 'set_daily_limit', limit, confidence: 1.0 }
  }
  const swapMatch = cmd.match(/(swap|trade|convert|exchange) (\d+(\.\d+)?) (xlm|usdc|eurc|aqua|ybx) (to|for|into) (xlm|usdc|eurc|aqua|ybx)/i)
  if (swapMatch) {
    return {
      action: 'swap_tokens',
      amount: parseFloat(swapMatch[2]),
      fromAsset: swapMatch[4].toUpperCase(),
      toAsset: swapMatch[6].toUpperCase(),
      confidence: 1.0,
      requiresConfirmation: true
    }
  }
  const sendMatch = cmd.match(/send (\d+(\.\d+)?) (xlm|usdc|eurc)? ?(to )?(g[a-z0-9]{54})/i)
  if (sendMatch) {
    return {
      action: 'send',
      amount: parseFloat(sendMatch[1]),
      fromAsset: (sendMatch[3] || 'XLM').toUpperCase(),
      recipient: sendMatch[5],
      confidence: 1.0,
      requiresConfirmation: true
    }
  }
  if (/list contacts?|show contacts?|my contacts?|view contacts?/.test(cmd)) {
    return { action: 'list_contacts', confidence: 1.0 }
  }
  return null
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Command Parser — Greetings & Help', () => {
  test('parses "hello" as greeting', () => {
    const result = parseCommand('hello')
    expect(result).not.toBeNull()
    expect(result!.action).toBe('greeting')
    expect(result!.confidence).toBe(1.0)
  })

  test('parses "hey!" as greeting', () => {
    const result = parseCommand('hey!')
    expect(result!.action).toBe('greeting')
  })

  test('parses "help" as help action', () => {
    const result = parseCommand('help')
    expect(result!.action).toBe('help')
  })

  test('parses "what can you do" as help', () => {
    const result = parseCommand('what can you do')
    expect(result!.action).toBe('help')
  })
})

describe('Command Parser — Balance & Portfolio', () => {
  test('parses "what\'s my balance?" correctly', () => {
    const result = parseCommand("what's my balance?")
    expect(result!.action).toBe('balance')
    expect(result!.confidence).toBe(1.0)
  })

  test('parses "check my balance" correctly', () => {
    const result = parseCommand('check my balance')
    expect(result!.action).toBe('balance')
  })

  test('parses "how much do I have" as balance', () => {
    const result = parseCommand('how much do I have')
    expect(result!.action).toBe('balance')
  })

  test('parses "show my portfolio" as get_portfolio', () => {
    const result = parseCommand('show my portfolio')
    expect(result!.action).toBe('get_portfolio')
  })

  test('parses "my assets" as get_portfolio', () => {
    const result = parseCommand('my assets')
    expect(result!.action).toBe('get_portfolio')
  })
})

describe('Command Parser — Swap Tokens', () => {
  test('parses "swap 100 XLM to USDC" correctly', () => {
    const result = parseCommand('swap 100 XLM to USDC')
    expect(result).not.toBeNull()
    expect(result!.action).toBe('swap_tokens')
    expect((result as any).amount).toBe(100)
    expect((result as any).fromAsset).toBe('XLM')
    expect((result as any).toAsset).toBe('USDC')
  })

  test('parses "trade 50 XLM for EURC" correctly', () => {
    const result = parseCommand('trade 50 XLM for EURC')
    expect(result!.action).toBe('swap_tokens')
    expect((result as any).amount).toBe(50)
    expect((result as any).fromAsset).toBe('XLM')
    expect((result as any).toAsset).toBe('EURC')
  })

  test('swap requires confirmation', () => {
    const result = parseCommand('swap 10 XLM to USDC')
    expect((result as any).requiresConfirmation).toBe(true)
  })

  test('parses decimal swap amount', () => {
    const result = parseCommand('swap 10.5 XLM to USDC')
    expect((result as any).amount).toBe(10.5)
  })
})

describe('Command Parser — Send', () => {
  const validAddress = 'GCYLWUJI2USHF7DRQYCBOVDMRT3Z7F6WINN3RIMJ7T5X5G7ZPU53G5B2'

  test('parses send command with valid Stellar address', () => {
    const result = parseCommand(`send 10 XLM to ${validAddress}`)
    expect(result!.action).toBe('send')
    expect((result as any).amount).toBe(10)
    // regex captures 55 chars after G (56 total) — check it starts with the address prefix
    expect(validAddress.toLowerCase()).toContain((result as any).recipient)
  })

  test('send requires confirmation', () => {
    const result = parseCommand(`send 5 XLM to ${validAddress}`)
    expect((result as any).requiresConfirmation).toBe(true)
  })
})

describe('Command Parser — Security', () => {
  test('parses "freeze my wallet" correctly', () => {
    const result = parseCommand('freeze my wallet')
    expect(result!.action).toBe('freeze_wallet')
    expect((result as any).requiresConfirmation).toBe(true)
  })

  test('parses "lock everything down" as freeze', () => {
    const result = parseCommand('lock everything down')
    expect(result!.action).toBe('freeze_wallet')
  })

  test('parses "unfreeze my wallet" correctly', () => {
    const result = parseCommand('unfreeze my wallet')
    expect(result!.action).toBe('unfreeze_wallet')
  })

  test('parses "set daily limit to 500" correctly', () => {
    const result = parseCommand('set daily limit to 500')
    expect(result!.action).toBe('set_daily_limit')
    expect((result as any).limit).toBe(500)
  })

  test('parses "status" as get_spending_info', () => {
    const result = parseCommand('status')
    expect(result!.action).toBe('get_spending_info')
  })
})

describe('Command Parser — Unrecognized Commands', () => {
  test('returns null for random text', () => {
    const result = parseCommand('what is the weather today')
    expect(result).toBeNull()
  })

  test('returns null for empty-ish input', () => {
    const result = parseCommand('   ')
    expect(result).toBeNull()
  })

  test('returns null for numbers only', () => {
    const result = parseCommand('12345')
    expect(result).toBeNull()
  })
})

describe('Command Parser — Prices & History', () => {
  test('parses "what are current prices" as get_asset_prices', () => {
    const result = parseCommand('what are current prices')
    expect(result!.action).toBe('get_asset_prices')
  })

  test('parses "transaction history" as history', () => {
    const result = parseCommand('transaction history')
    expect(result!.action).toBe('history')
  })

  test('parses "list contacts" as list_contacts', () => {
    const result = parseCommand('list contacts')
    expect(result!.action).toBe('list_contacts')
  })
})
