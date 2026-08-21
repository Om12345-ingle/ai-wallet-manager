import { buildActivityCsv, summarizeActivity, type LedgerInteraction } from '@/lib/activityProof'

const wallet = `G${'A'.repeat(55)}`
const otherA = `G${'B'.repeat(55)}`
const otherB = `G${'C'.repeat(55)}`

const interaction = (
  id: string,
  createdAt: string,
  to: string,
): LedgerInteraction => ({
  id,
  transactionHash: id.repeat(64).slice(0, 64),
  type: 'send',
  amount: '1.0000000',
  asset: 'XLM',
  from: wallet,
  to,
  createdAt,
  successful: true,
})

describe('activity proof', () => {
  test('counts real interactions, counterpart wallets, and 2–3 minute intervals', () => {
    const result = summarizeActivity(
      [
        interaction('a', '2026-08-21T10:05:00.000Z', otherB),
        interaction('b', '2026-08-21T10:00:00.000Z', otherA),
        interaction('c', '2026-08-21T10:02:30.000Z', otherA),
      ],
      wallet,
    )

    expect(result.totalInteractions).toBe(3)
    expect(result.distinctCounterpartWallets).toBe(2)
    expect(result.qualifyingIntervals).toBe(2)
    expect(result.intervalOpportunities).toBe(2)
  })

  test('exports auditable CSV rows with interval and explorer evidence', () => {
    const csv = buildActivityCsv(
      [
        interaction('a', '2026-08-21T10:00:00.000Z', otherA),
        interaction('b', '2026-08-21T10:02:00.000Z', otherB),
      ],
      wallet,
    )

    expect(csv).toContain('interval_2_to_3_minutes')
    expect(csv).toContain(',120,true,')
    expect(csv).toContain('stellar.expert/explorer/testnet/tx/')
  })
})
