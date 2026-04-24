'use client'

import { useState, useEffect } from 'react'
import MultiAssetPortfolio from '../MultiAssetPortfolio'
import { useAppContext } from '@/contexts/AppContext'
import ContractStatus from '@/components/ContractStatus'

export default function Dashboard() {
  const { state, updateBalance, updateSpendingInfo, setActiveTab } = useAppContext()
  const { publicKey, secretKey, balance, spendingInfo } = state
  const [loading, setLoading] = useState(false)

  const fetchBalance = async () => {
    if (!publicKey) return
    setLoading(true)
    try {
      const response = await fetch('/api/stellar/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey })
      })
      const data = await response.json()
      if (data.balance !== undefined) updateBalance(data.balance)
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSpendingInfo = async () => {
    try {
      const response = await fetch('/api/stellar/smart-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_spending_info', publicKey, secretKey })
      })
      const data = await response.json()
      if (response.ok && data.spendingInfo) updateSpendingInfo(data.spendingInfo)
    } catch (error) {
      console.error('Error fetching spending info:', error)
    }
  }

  useEffect(() => {
    if (publicKey) {
      fetchBalance()
      fetchSpendingInfo()
    }
  }, [publicKey])

  return (
    <div className="space-y-6">

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/15 rounded-2xl p-5 hover:scale-105 transition-all duration-300">
          <div className="text-2xl mb-2">💰</div>
          <div className="text-xs text-gray-400 mb-1">Balance</div>
          <div className="text-2xl font-bold text-white">
            {loading ? <span className="animate-pulse text-base">Loading...</span> : `${parseFloat(balance || '0').toFixed(2)} XLM`}
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/15 rounded-2xl p-5 hover:scale-105 transition-all duration-300">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-xs text-gray-400 mb-1">Daily Spending</div>
          <div className="text-xl font-bold text-white">
            {spendingInfo ? `${spendingInfo.dailySpent}/${spendingInfo.dailyLimit}` : '0/1000'} XLM
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/15 rounded-2xl p-5 hover:scale-105 transition-all duration-300">
          <div className="text-2xl mb-2">{spendingInfo?.isFrozen ? '🔒' : '✅'}</div>
          <div className="text-xs text-gray-400 mb-1">Wallet Status</div>
          <div className="text-xl font-bold text-white">{spendingInfo?.isFrozen ? 'FROZEN' : 'ACTIVE'}</div>
        </div>
      </div>

      {/* Portfolio */}
      <MultiAssetPortfolio />

      {/* Quick Actions + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Quick Actions */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/15 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">⚡ Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={fetchBalance} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 text-left">
              <span className="text-xl">🔄</span>
              <div>
                <div className="text-white text-sm font-medium">Refresh Balance</div>
                <div className="text-gray-400 text-xs">Update your XLM balance</div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 text-left"
            >
              <span className="text-xl">🤖</span>
              <div>
                <div className="text-white text-sm font-medium">Open AI Chat</div>
                <div className="text-gray-400 text-xs">Natural language wallet commands</div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 text-left"
            >
              <span className="text-xl">👥</span>
              <div>
                <div className="text-white text-sm font-medium">Manage Contacts</div>
                <div className="text-gray-400 text-xs">Save addresses and send XLM</div>
              </div>
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/stellar/fund-testnet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ publicKey })
                  })
                  const data = await res.json()
                  if (res.ok) { alert('Funded with 10,000 test XLM!'); fetchBalance() }
                  else alert(`Funding failed: ${data.error}`)
                } catch { alert('Failed to fund. Try Friendbot directly.') }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30 transition-all duration-200 text-left"
            >
              <span className="text-xl">💸</span>
              <div>
                <div className="text-green-300 text-sm font-medium">Fund Testnet Account</div>
                <div className="text-gray-400 text-xs">Get 10,000 free test XLM</div>
              </div>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/15 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">📈 System Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Wallet Connected', ok: true },
              { label: 'Balance Loaded', ok: !!balance && balance !== '0' },
              { label: 'Testnet Network', ok: true },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-white text-sm">{item.label}</span>
                </div>
                <span className="text-sm">{item.ok ? '✅' : '⏳'}</span>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-white text-sm">Smart Contracts</span>
              </div>
              <ContractStatus />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
