/**
 * Tests for Wallet API — live Stellar Testnet integration
 * Uses the funded testnet account
 */

const TESTNET_HORIZON = 'https://horizon-testnet.stellar.org'
const TEST_PUBLIC_KEY = 'GCYLWUJI2USHF7DRQYCBOVDMRT3Z7F6WINN3RIMJ7T5X5G7ZPU53G5B2'

const wait = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds))

async function fetchWithRateLimitRetry(url: string, init?: RequestInit) {
  let response: Response | undefined

  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(url, init)
    if (response.status !== 429) return response

    const retryAfter = Number(response.headers.get('retry-after'))
    const delay = Number.isFinite(retryAfter)
      ? Math.min(retryAfter * 1000, 5000)
      : 1000 * (attempt + 1)
    await wait(delay)
  }

  return response!
}

describe('Stellar Testnet — Account', () => {
  let accountStatus: number
  let accountData: any

  beforeAll(async () => {
    const response = await fetchWithRateLimitRetry(
      `${TESTNET_HORIZON}/accounts/${TEST_PUBLIC_KEY}`
    )
    accountStatus = response.status
    accountData = await response.json()
  }, 30_000)

  test('testnet account exists and is funded', async () => {
    expect(accountStatus).toBe(200)
    expect(accountData.account_id).toBe(TEST_PUBLIC_KEY)
  })

  test('account has XLM balance above 0', async () => {
    const xlm = accountData.balances.find((b: any) => b.asset_type === 'native')
    expect(xlm).toBeDefined()
    expect(parseFloat(xlm.balance)).toBeGreaterThan(0)
  })

  test('account has valid sequence number', async () => {
    expect(accountData.sequence).toBeDefined()
    expect(parseInt(accountData.sequence)).toBeGreaterThan(0)
  })
})

describe('Stellar Testnet — Transactions', () => {
  let transactionStatus: number
  let transactionData: any

  beforeAll(async () => {
    const response = await fetchWithRateLimitRetry(
      `${TESTNET_HORIZON}/accounts/${TEST_PUBLIC_KEY}/transactions?limit=5&order=desc`
    )
    transactionStatus = response.status
    transactionData = await response.json()
  }, 30_000)

  test('account has at least one transaction', async () => {
    expect(transactionStatus).toBe(200)
    const records = transactionData._embedded?.records ?? []
    expect(records.length).toBeGreaterThan(0)
  })

  test('first transaction was successful', async () => {
    const tx = transactionData._embedded?.records?.[0]
    expect(tx).toBeDefined()
    expect(tx.successful).toBe(true)
  })

  test('transaction hash is 64 hex characters', async () => {
    const tx = transactionData._embedded?.records?.[0]
    expect(tx.hash).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('Stellar Testnet — Horizon API', () => {
  let horizonStatus: number
  let horizonData: any

  beforeAll(async () => {
    const response = await fetchWithRateLimitRetry(TESTNET_HORIZON)
    horizonStatus = response.status
    horizonData = await response.json()
  }, 30_000)

  test('Horizon testnet is reachable', async () => {
    expect(horizonStatus).toBe(200)
  })

  test('Horizon returns valid JSON', async () => {
    expect(horizonData).toBeDefined()
    expect(typeof horizonData).toBe('object')
  })

  test('Friendbot endpoint is reachable', async () => {
    // Just check the endpoint exists (don't fund again)
    const res = await fetchWithRateLimitRetry(
      'https://friendbot.stellar.org',
      { method: 'HEAD' }
    )
    expect([200, 400, 404, 405]).toContain(res.status)
  })
})
