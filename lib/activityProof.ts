export type LedgerInteraction = {
  id: string
  transactionHash: string
  type: 'send' | 'receive'
  amount: string
  asset: string
  from: string
  to: string
  createdAt: string
  successful: boolean
}

export type ActivityProofSummary = {
  totalInteractions: number
  distinctCounterpartWallets: number
  qualifyingIntervals: number
  intervalOpportunities: number
  earliestInteraction: string | null
  latestInteraction: string | null
}

const MIN_INTERVAL_SECONDS = 120
const MAX_INTERVAL_SECONDS = 180

export function summarizeActivity(
  interactions: LedgerInteraction[],
  connectedWallet: string,
): ActivityProofSummary {
  const confirmed = interactions
    .filter((interaction) => interaction.successful)
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    )

  const counterpartWallets = new Set(
    confirmed
      .map((interaction) =>
        interaction.from === connectedWallet ? interaction.to : interaction.from,
      )
      .filter(Boolean),
  )

  let qualifyingIntervals = 0
  for (let index = 1; index < confirmed.length; index += 1) {
    const previous = new Date(confirmed[index - 1].createdAt).getTime()
    const current = new Date(confirmed[index].createdAt).getTime()
    const intervalSeconds = (current - previous) / 1000
    if (
      intervalSeconds >= MIN_INTERVAL_SECONDS &&
      intervalSeconds <= MAX_INTERVAL_SECONDS
    ) {
      qualifyingIntervals += 1
    }
  }

  return {
    totalInteractions: confirmed.length,
    distinctCounterpartWallets: counterpartWallets.size,
    qualifyingIntervals,
    intervalOpportunities: Math.max(0, confirmed.length - 1),
    earliestInteraction: confirmed[0]?.createdAt ?? null,
    latestInteraction: confirmed.at(-1)?.createdAt ?? null,
  }
}

function csvCell(value: string | number | boolean) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function buildActivityCsv(
  interactions: LedgerInteraction[],
  connectedWallet: string,
) {
  const ordered = [...interactions].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  )
  const headers = [
    'interaction_number',
    'wallet_address',
    'counterparty_wallet',
    'direction',
    'asset',
    'amount',
    'transaction_hash',
    'timestamp_utc',
    'interval_seconds',
    'interval_2_to_3_minutes',
    'stellar_expert_url',
  ]

  const rows = ordered.map((interaction, index) => {
    const previous = ordered[index - 1]
    const intervalSeconds = previous
      ? Math.round(
          (new Date(interaction.createdAt).getTime() -
            new Date(previous.createdAt).getTime()) /
            1000,
        )
      : ''
    const qualifies =
      typeof intervalSeconds === 'number' &&
      intervalSeconds >= MIN_INTERVAL_SECONDS &&
      intervalSeconds <= MAX_INTERVAL_SECONDS
    const counterparty =
      interaction.from === connectedWallet ? interaction.to : interaction.from

    return [
      index + 1,
      connectedWallet,
      counterparty,
      interaction.type,
      interaction.asset,
      interaction.amount,
      interaction.transactionHash,
      interaction.createdAt,
      intervalSeconds,
      qualifies,
      `https://stellar.expert/explorer/testnet/tx/${interaction.transactionHash}`,
    ]
      .map(csvCell)
      .join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}
