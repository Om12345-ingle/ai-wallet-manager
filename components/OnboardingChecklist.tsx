'use client'

import { useEffect, useState } from 'react'

interface OnboardingChecklistProps {
  publicKey: string
  balance: string
  onNavigate: (tab: string) => void
}

export default function OnboardingChecklist({
  publicKey,
  balance,
  onNavigate,
}: OnboardingChecklistProps) {
  const [exploredFeature, setExploredFeature] = useState(false)
  const [feedbackShared, setFeedbackShared] = useState(false)
  const [activityVerified, setActivityVerified] = useState(false)

  useEffect(() => {
    const refresh = () => {
      setExploredFeature(localStorage.getItem('onboarding-core-feature') === 'complete')
      setFeedbackShared(Boolean(localStorage.getItem('latest-feedback-receipt')))
      setActivityVerified(Boolean(localStorage.getItem('activity-proof-viewed')))
    }
    refresh()
    window.addEventListener('onboarding-progress', refresh)
    window.addEventListener('feedback-submitted', refresh)
    return () => {
      window.removeEventListener('onboarding-progress', refresh)
      window.removeEventListener('feedback-submitted', refresh)
    }
  }, [])

  const funded = Number.parseFloat(balance || '0') > 0
  const steps = [
    { label: 'Connect A Stellar Wallet', complete: Boolean(publicKey) },
    { label: 'Fund & Verify The Account', complete: funded },
    { label: 'Explore A Core Wallet Feature', complete: exploredFeature },
    { label: 'Verify Real Ledger Activity', complete: activityVerified },
    { label: 'Share Product Feedback', complete: feedbackShared },
  ]
  const completed = steps.filter((step) => step.complete).length

  const explore = () => {
    localStorage.setItem('onboarding-core-feature', 'complete')
    setExploredFeature(true)
    window.dispatchEvent(new Event('onboarding-progress'))
    onNavigate('chat')
  }

  return (
    <section
      aria-labelledby="onboarding-title"
      className="rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 via-black/20 to-white/5 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
            First-Run Guide
          </p>
          <h2 id="onboarding-title" className="mt-1 text-xl font-bold text-white text-balance">
            Complete Your Wallet Setup
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {completed} of {steps.length} onboarding steps complete
          </p>
        </div>
        <div
          className="min-w-20 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center"
          aria-label={`${Math.round((completed / steps.length) * 100)} percent complete`}
        >
          <div className="text-2xl font-bold tabular-nums text-white">
            {Math.round((completed / steps.length) * 100)}%
          </div>
          <div className="text-[11px] uppercase tracking-wider text-gray-500">Ready</div>
        </div>
      </div>

      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <span
              aria-hidden="true"
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                step.complete
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-white/10 text-gray-400'
              }`}
            >
              {step.complete ? '✓' : index + 1}
            </span>
            <span className={step.complete ? 'text-sm text-gray-300' : 'text-sm text-white'}>
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {!exploredFeature && (
          <button
            type="button"
            onClick={explore}
            className="rounded-xl border border-yellow-500/30 bg-yellow-500/15 px-4 py-3 text-sm font-semibold text-yellow-200 transition-colors hover:bg-yellow-500/25 focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            Try AI Wallet Chat
          </button>
        )}
        {!feedbackShared && (
          <button
            type="button"
            onClick={() => onNavigate('feedback')}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Share Feedback
          </button>
        )}
        <button
          type="button"
          onClick={() => onNavigate('activity')}
          className="rounded-xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          Open Activity Proof
        </button>
      </div>
    </section>
  )
}
