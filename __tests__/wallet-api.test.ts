/**
 * Tests for Wallet API — live Stellar Testnet integration
 * Uses the funded testnet account
 */

const TESTNET_HORIZON = 'https://horizon-testnet.stellar.org'
const TEST_PUBLIC_KEY = 'GCYLWUJI2USHF7DRQYCBOVDMRT3Z7F6WINN3RIMJ7T5X5G7ZPU53G5B2'

describe('Stellar Testnet — Account', () => {
  test('testnet account exists and is funded', async () => {
    const res = await fetch(`${TESTNET_HORIZON}/accounts/${TEST_PUBLIC_KEY}`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.account_id).toBe(TEST_PUBLIC_KEY)
  })

  test('account has XLM balance above 0', async () => {
    const res = await fetch(`${TESTNET_HORIZON}/accounts/${TEST_PUBLIC_KEY}`)
    const data = await res.json()
    const xlm = data.balances.find((b: any) => b.asset_type === 'native')
    expect(xlm).toBeDefined()
    expect(parseFloat(xlm.balance)).toBeGreaterThan(0)
  })

  test('account has valid sequence number', async () => {
    const res = await fetch(`${TESTNET_HORIZON}/accounts/${TEST_PUBLIC_KEY}`)
    const data = await res.json()
    expect(data.sequence).toBeDefined()
    expect(parseInt(data.sequence)).toBeGreaterThan(0)
  })
})

describe('Stellar Testnet — Transactions', () => {
  test('account has at least one transaction', async () => {
    const res = await fetch(
      `${TESTNET_HORIZON}/accounts/${TEST_PUBLIC_KEY}/transactions?limit=5&order=desc`
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    const records = data._embedded?.records ?? []
    expect(records.length).toBeGreaterThan(0)
  })

  test('first transaction was successful', async () => {
    const res = await fetch(
      `${TESTNET_HORIZON}/accounts/${TEST_PUBLIC_KEY}/transactions?limit=1&order=desc`
    )
    const data = await res.json()
    const tx = data._embedded?.records?.[0]
    expect(tx).toBeDefined()
    expect(tx.successful).toBe(true)
  })

  test('transaction hash is 64 hex characters', async () => {
    const res = await fetch(
      `${TESTNET_HORIZON}/accounts/${TEST_PUBLIC_KEY}/transactions?limit=1&order=desc`
    )
    const data = await res.json()
    const tx = data._embedded?.records?.[0]
    expect(tx.hash).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('Stellar Testnet — Horizon API', () => {
  test('Horizon testnet is reachable', async () => {
    const res = await fetch(TESTNET_HORIZON)
    expect(res.status).toBe(200)
  })

  test('Horizon returns valid JSON', async () => {
    const res = await fetch(TESTNET_HORIZON)
    const data = await res.json()
    expect(data).toBeDefined()
    expect(typeof data).toBe('object')
  })

  test('Friendbot endpoint is reachable', async () => {
    // Just check the endpoint exists (don't fund again)
    const res = await fetch('https://friendbot.stellar.org', { method: 'HEAD' })
    expect([200, 400, 404, 405]).toContain(res.status)
  })
})
