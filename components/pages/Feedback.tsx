'use client'

import { FormEvent, useState } from 'react'
import { track } from '@vercel/analytics'
import { useAppContext } from '@/contexts/AppContext'

type FeedbackReceipt = {
  id: string
  submittedAt: string
  rating: number
  category: string
}

const categories = [
  'Wallet onboarding',
  'AI commands',
  'Transactions',
  'Security controls',
  'Portfolio analytics',
  'Mobile experience',
]

export default function Feedback() {
  const { state } = useAppContext()
  const [rating, setRating] = useState(0)
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<FeedbackReceipt | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submitFeedback = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!rating) {
      setError('Choose a rating from 1 to 5.')
      return
    }
    if (!category) {
      setError('Choose the product area you reviewed.')
      return
    }
    if (message.trim().length < 10) {
      setError('Add at least 10 characters so the feedback is actionable.')
      return
    }

    setSubmitting(true)
    const nextReceipt: FeedbackReceipt = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      rating,
      category,
    }

    track('user_feedback_submitted', {
      rating,
      category,
      comment: message.trim().slice(0, 200),
      walletConnected: Boolean(state.publicKey),
    })

    localStorage.setItem('latest-feedback-receipt', JSON.stringify(nextReceipt))
    setReceipt(nextReceipt)
    setMessage('')
    setSubmitting(false)
    window.dispatchEvent(new Event('feedback-submitted'))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
          Product Review
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white text-balance">Share Product Feedback</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
          Your response is recorded as a privacy-conscious product analytics event. Wallet secrets
          are never collected.
        </p>
      </header>

      <form
        onSubmit={submitFeedback}
        className="space-y-6 rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-7"
      >
        <fieldset>
          <legend className="text-sm font-semibold text-white">Overall Rating</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition-colors ${
                  rating === value
                    ? 'border-yellow-400 bg-yellow-500/20 text-yellow-200'
                    : 'border-white/15 bg-black/20 text-gray-300 hover:bg-white/10'
                }`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="sr-only"
                />
                {value} {value === 1 ? 'Star' : 'Stars'}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="feedback-category" className="text-sm font-semibold text-white">
            Product Area
          </label>
          <select
            id="feedback-category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/15 bg-gray-950 px-4 py-3 text-white focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <option value="">Choose an area…</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="feedback-message" className="text-sm font-semibold text-white">
            What Worked Or Needs Improvement?
          </label>
          <textarea
            id="feedback-message"
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            maxLength={600}
            autoComplete="off"
            placeholder="Example: The wallet connection was clear, but transaction confirmation could explain fees…"
            className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-yellow-400"
          />
          <p className="mt-2 text-right text-xs tabular-nums text-gray-500">{message.length}/600</p>
        </div>

        <div aria-live="polite">
          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}
          {receipt && (
            <div className="rounded-xl border border-green-400/30 bg-green-500/10 p-4 text-sm text-green-200">
              <p className="font-semibold">Feedback Recorded</p>
              <p className="mt-1 break-words text-green-200/80">
                Receipt {receipt.id.slice(0, 8)} ·{' '}
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(receipt.submittedAt))}
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl border border-yellow-400/30 bg-yellow-500/20 px-5 py-3 font-semibold text-yellow-100 transition-colors hover:bg-yellow-500/30 focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? 'Recording Feedback…' : 'Record Feedback'}
        </button>
      </form>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Monitoring status">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">Usage Analytics</p>
          <p className="mt-2 font-semibold text-green-300">Vercel Web Analytics Active</p>
          <p className="mt-1 text-sm text-gray-400">Page views and product events are monitored.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">Performance</p>
          <p className="mt-2 font-semibold text-green-300">Speed Insights Active</p>
          <p className="mt-1 text-sm text-gray-400">Core Web Vitals are measured in production.</p>
        </div>
      </section>
    </div>
  )
}
