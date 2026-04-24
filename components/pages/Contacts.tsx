'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/AppContext'

export default function Contacts() {
  const { state, addContact, removeContact } = useAppContext()
  const { contacts, publicKey, secretKey } = state

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [sendTo, setSendTo] = useState<string | null>(null)
  const [sendAmount, setSendAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [error, setError] = useState('')

  const isValidAddress = (addr: string) => /^G[A-Z0-9]{55}$/.test(addr)

  const handleAdd = () => {
    setError('')
    if (!name.trim()) return setError('Name is required')
    if (!isValidAddress(address)) return setError('Invalid Stellar address (must start with G and be 56 chars)')
    if (contacts.find(c => c.name === name.trim().toLowerCase()))
      return setError('A contact with that name already exists')
    addContact({ name: name.trim().toLowerCase(), address: address.trim() })
    setName('')
    setAddress('')
  }

  const handleSend = async (contact: { name: string; address: string }) => {
    setSendTo(contact.address)
    setSendResult(null)
    setSendAmount('')
  }

  const confirmSend = async () => {
    if (!sendAmount || isNaN(parseFloat(sendAmount))) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/stellar/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey,
          secretKey,
          recipient: sendTo,
          amount: sendAmount
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSendResult({ ok: true, msg: `✅ Sent ${sendAmount} XLM! Tx: ${data.hash?.slice(0, 12)}...` })
        setSendTo(null)
        setSendAmount('')
      } else {
        setSendResult({ ok: false, msg: `❌ ${data.error || 'Send failed'}` })
      }
    } catch (e: any) {
      setSendResult({ ok: false, msg: `❌ ${e.message}` })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Contacts</h1>
        <p className="text-gray-400 text-sm mt-1">Save Stellar addresses and send XLM instantly.</p>
      </div>

      {/* Add Contact */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/15 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">➕ Add Contact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name (e.g. Alice)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 text-sm"
          />
          <input
            type="text"
            placeholder="Stellar address (G...)"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 text-sm font-mono"
          />
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <button
          onClick={handleAdd}
          className="mt-4 px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-medium transition-all duration-200 hover:scale-105"
        >
          Save Contact
        </button>
      </div>

      {/* Send Modal */}
      {sendTo && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3">💸 Send XLM</h2>
          <p className="text-gray-400 text-sm mb-4 font-mono break-all">To: {sendTo}</p>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Amount (XLM)"
              value={sendAmount}
              onChange={e => setSendAmount(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 text-sm"
            />
            <button
              onClick={confirmSend}
              disabled={sending}
              className="px-6 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 text-sm font-medium transition-all duration-200 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
            <button
              onClick={() => { setSendTo(null); setSendAmount('') }}
              className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-400 text-sm transition-all duration-200"
            >
              Cancel
            </button>
          </div>
          {sendResult && (
            <p className={`mt-3 text-sm ${sendResult.ok ? 'text-green-400' : 'text-red-400'}`}>
              {sendResult.msg}
            </p>
          )}
        </div>
      )}

      {sendResult && !sendTo && (
        <div className={`p-4 rounded-xl border text-sm ${sendResult.ok ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          {sendResult.msg}
        </div>
      )}

      {/* Contact List */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/15 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">👥 Saved Contacts ({contacts.length})</h2>
        {contacts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-gray-400">No contacts yet.</p>
            <p className="text-gray-500 text-sm mt-1">Add one above or say "Save G... as Alice" in the AI chat.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-black/30 border border-white/20 flex items-center justify-center text-lg flex-shrink-0">
                    {contact.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium capitalize">{contact.name}</p>
                    <p className="text-gray-400 text-xs font-mono truncate">
                      {contact.address.slice(0, 12)}...{contact.address.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => handleSend(contact)}
                    disabled={!publicKey}
                    className="px-4 py-2 rounded-lg bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-300 text-xs font-medium transition-all duration-200 disabled:opacity-40"
                  >
                    Send XLM
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(contact.address)}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-gray-400 text-xs transition-all duration-200"
                    title="Copy address"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => removeContact(contact.name)}
                    className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs transition-all duration-200"
                    title="Remove contact"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
