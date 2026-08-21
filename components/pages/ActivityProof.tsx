'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { track } from '@vercel/analytics'
import { useAppContext } from '@/contexts/AppContext'
import {
  buildActivityCsv,
  LedgerInteraction,
  summarizeActivity,
} from '@/lib/activityProof'

const TARGET_INTERACTIONS = 50

export default function ActivityProof() {
  const { state } = useAppContext()
  const [interactions, setInteractions] = useState<LedgerInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadActivity = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/stellar/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: state.publicKey, limit: 200 }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load ledger activity.')
      setInteractions(data.interactions || [])
      localStorage.setItem('activity-proof-viewed', new Date().toISOString())
      window.dispatchEvent(new Event('onboarding-progress'))
      track('activity_proof_viewed', {
        interactionCount: data.interactions?.length || 0,
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load ledger activity.')
    } finally {
      setLoading(false)
    }
  }, [state.publicKey])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  const summary = useMemo(
    () => summarizeActivity(interactions, state.publicKey),
    [interactions, state.publicKey],
  )
  const progress = Math.min(100, Math.round((summary.totalInteractions / TARGET_INTERACTIONS) * 100))

  const exportCsv = () => {
    const csv = buildActivityCsv(interactions, state.publicKey)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stellar-activity-${state.publicKey.slice(0, 8)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    track('activity_proof_exported', { interactionCount: interactions.length })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
            Level 5 Growth Evidence
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white text-balance">On-Chain Activity Proof</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Live testnet records for the connected wallet. Only confirmed ledger transactions count;
            the app never manufactures user activity.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={loadActivity}
            disabled={loading}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? 'Refreshing…' : 'Refresh Ledger'}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!interactions.length}
            className="rounded-xl border border-yellow-400/30 bg-yellow-500/20 px-4 py-3 text-sm font-semibold text-yellow-100 hover:bg-yellow-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export Evidence CSV
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">50-interaction target</p>
            <p className="mt-1 text-sm text-gray-400">
              {summary.totalInteractions} confirmed interactions · {TARGET_INTERACTIONS - Math.min(summary.totalInteractions, TARGET_INTERACTIONS)} remaining
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-yellow-300">{progress}%</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/40" aria-label={`${progress}% complete`}>
          <div className="h-full rounded-full bg-yellow-400 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Activity summary">
        {[
          ['Confirmed interactions', summary.totalInteractions],
          ['Distinct counterpart wallets', summary.distinctCounterpartWallets],
          ['Intervals within 2–3 min', `${summary.qualifyingIntervals}/${summary.intervalOpportunities}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm text-blue-100">
          <span aria-hidden="true">ℹ️</span>
          <p>
            Recruit consenting participants with their own testnet wallets. Ask each participant to
            complete a real wallet action, then wait 2–3 minutes before the next recorded action.
            Never reuse seed phrases or submit automated activity as user proof.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && interactions.length === 0 && (
          <div className="py-12 text-center">
            <p className="font-semibold text-white">No confirmed payments found yet</p>
            <p className="mt-2 text-sm text-gray-400">Complete a testnet payment, then refresh this page.</p>
          </div>
        )}

        {interactions.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Direction</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Counterparty</th>
                  <th className="px-3 py-3">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {interactions.map((interaction) => {
                  const counterparty = interaction.from === state.publicKey ? interaction.to : interaction.from
                  return (
                    <tr key={interaction.id} className="text-gray-300">
                      <td className="px-3 py-4 whitespace-nowrap">
                        {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(interaction.createdAt))}
                      </td>
                      <td className="px-3 py-4 capitalize">{interaction.type}</td>
                      <td className="px-3 py-4 tabular-nums">{interaction.amount} {interaction.asset}</td>
                      <td className="px-3 py-4 font-mono text-xs">{counterparty.slice(0, 8)}…{counterparty.slice(-6)}</td>
                      <td className="px-3 py-4">
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${interaction.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-yellow-300 underline-offset-4 hover:underline"
                        >
                          View transaction ↗
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
