'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppContext } from '@/contexts/AppContext'

export default function SpendingLimits() {
  const { state, updateSpendingInfo } = useAppContext()
  const { publicKey, secretKey, spendingInfo } = state
  const [loading, setLoading] = useState(false)
  const [dailyLimit, setDailyLimit] = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')

  const callSmartContract = useCallback(async (action: string, params: any = {}) => {
    setLoading(true)
    try {
      const requestBody = {
        action,
        publicKey,
        secretKey,
        ...params
      }
      console.log('Smart contract request:', requestBody)
      
      const response = await fetch('/api/stellar/smart-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      console.log('Smart contract response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Smart contract call failed')
      }

      return data
    } catch (error: any) {
      console.error('Smart contract error:', error)
      alert(`Error: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [publicKey, secretKey])

  const loadSpendingInfo = useCallback(async () => {
    try {
      console.log('Loading spending info for publicKey:', publicKey)
      const result = await callSmartContract('get_spending_info')
      console.log('Spending info result:', result)
      
      if (result.spendingInfo) {
        const newSpendingInfo = {
          dailyLimit: result.spendingInfo.dailyLimit || 1000,
          dailySpent: result.spendingInfo.dailySpent || 0,
          monthlyLimit: result.spendingInfo.monthlyLimit || 10000,
          monthlySpent: result.spendingInfo.monthlySpent || 0,
          isFrozen: result.spendingInfo.isFrozen || false
        }
        console.log('Updating spending info with:', newSpendingInfo)
        updateSpendingInfo(newSpendingInfo)
      } else {
        console.warn('No spendingInfo in result:', result)
      }
    } catch (error) {
      console.error('Failed to load spending info:', error)
    }
  }, [callSmartContract, publicKey, updateSpendingInfo])

  useEffect(() => {
    if (publicKey) {
      loadSpendingInfo()
    }
  }, [publicKey, loadSpendingInfo])

  const handleSetDailyLimit = async () => {
    if (!dailyLimit) {
      alert('Please enter a daily limit amount')
      return
    }
    
    const limitValue = parseFloat(dailyLimit)
    if (isNaN(limitValue) || limitValue <= 0) {
      alert('Please enter a valid positive number')
      return
    }
    
    try {
      console.log('Setting daily limit:', limitValue, 'for publicKey:', publicKey)
      const result = await callSmartContract('set_daily_limit', { dailyLimit: limitValue })
      console.log('Daily limit result:', result)
      
      alert(`🔒 Daily spending limit set to ${dailyLimit} XLM`)
      setDailyLimit('')
      
      // Force reload spending info
      await loadSpendingInfo()
      console.log('Spending info reloaded after setting daily limit')
    } catch (error: any) {
      console.error('Daily limit error:', error)
      alert(`Failed to set daily limit: ${error.message}`)
    }
  }

  const handleSetMonthlyLimit = async () => {
    if (!monthlyLimit) {
      alert('Please enter a monthly limit amount')
      return
    }
    
    const limitValue = parseFloat(monthlyLimit)
    if (isNaN(limitValue) || limitValue <= 0) {
      alert('Please enter a valid positive number')
      return
    }
    
    try {
      console.log('Setting monthly limit:', limitValue, 'for publicKey:', publicKey)
      const result = await callSmartContract('set_monthly_limit', { monthlyLimit: limitValue })
      console.log('Monthly limit result:', result)
      
      alert(`🔒 Monthly spending limit set to ${monthlyLimit} XLM`)
      setMonthlyLimit('')
      
      // Force reload spending info
      await loadSpendingInfo()
      console.log('Spending info reloaded after setting monthly limit')
    } catch (error: any) {
      console.error('Monthly limit error:', error)
      alert(`Failed to set monthly limit: ${error.message}`)
    }
  }

  const handleResetLimits = async () => {
    if (confirm('Are you sure you want to reset your spending counters?')) {
      try {
        await callSmartContract('reset_spending_limits')
        alert('✅ Spending limits reset successfully')
        loadSpendingInfo()
      } catch (error) {
        console.error('Reset error:', error)
      }
    }
  }

  const getProgressPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-white/60'
    if (percentage >= 70) return 'bg-white/50'
    if (percentage >= 50) return 'bg-white/40'
    return 'bg-white/30'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-8 shadow-2xl animate-slide-in-up">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient-modern mb-4">💰 Spending Limits</h1>
          <p className="text-gray-300">
            Set and monitor your daily and monthly spending limits for enhanced security
          </p>
        </div>
      </div>

      {/* Current Status */}
      {spendingInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Limit Card */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6 shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">📅 Daily Limit</h3>
              <button
                onClick={loadSpendingInfo}
                disabled={loading}
                className="kiro-btn kiro-btn-ghost text-sm hover:scale-105 transition-transform duration-300"
              >
                🔄
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-modern mb-2">
                  {spendingInfo.dailyLimit} XLM
                </div>
                <div className="text-sm text-gray-400">Daily Limit</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Spent Today</span>
                  <span className="text-white">{spendingInfo.dailySpent} XLM</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(getProgressPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit))}`}
                    style={{ width: `${getProgressPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit)}%` }}
                  ></div>
                </div>
                
                <div className="text-center text-sm text-gray-400">
                  {(spendingInfo.dailyLimit - spendingInfo.dailySpent).toFixed(2)} XLM remaining
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Limit Card */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6 shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">📊 Monthly Limit</h3>
              <div className="text-sm text-gray-400">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-modern mb-2">
                  {spendingInfo.monthlyLimit} XLM
                </div>
                <div className="text-sm text-gray-400">Monthly Limit</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Spent This Month</span>
                  <span className="text-white">{spendingInfo.monthlySpent} XLM</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(getProgressPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit))}`}
                    style={{ width: `${getProgressPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit)}%` }}
                  ></div>
                </div>
                
                <div className="text-center text-sm text-gray-400">
                  {(spendingInfo.monthlyLimit - spendingInfo.monthlySpent).toFixed(2)} XLM remaining
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Set Daily Limit */}
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 text-white">🎯 Set Daily Limit</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Daily Spending Limit (XLM)
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="1000"
                className="kiro-input"
              />
            </div>
            <button
              onClick={handleSetDailyLimit}
              disabled={loading || !dailyLimit}
              className="w-full kiro-btn kiro-btn-primary hover:scale-105 transition-transform duration-300"
            >
              {loading ? '⏳ Setting...' : '💰 Set Daily Limit'}
            </button>
          </div>
        </div>

        {/* Set Monthly Limit */}
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 text-white">📈 Set Monthly Limit</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Monthly Spending Limit (XLM)
              </label>
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="10000"
                className="kiro-input"
              />
            </div>
            <button
              onClick={handleSetMonthlyLimit}
              disabled={loading || !monthlyLimit}
              className="w-full kiro-btn kiro-btn-success hover:scale-105 transition-transform duration-300"
            >
              {loading ? '⏳ Setting...' : '📊 Set Monthly Limit'}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-gradient-modern">⚙️ Limit Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleResetLimits}
            disabled={loading}
            className="kiro-btn kiro-btn-ghost hover:scale-105 transition-transform duration-300"
          >
            🔄 Reset Counters
          </button>
          
          <button
            onClick={() => {
              const tips = [
                '💡 Set realistic daily limits based on your spending habits',
                '📊 Monitor your spending regularly to stay within limits',
                '🔒 Lower limits provide better security against unauthorized access',
                '⏰ Limits reset automatically at midnight (daily) and month start',
                '🚨 Frozen wallets block all transactions regardless of limits'
              ];
              alert(`Spending Limit Tips:\n\n${tips.join('\n\n')}`);
            }}
            className="kiro-btn kiro-btn-secondary hover:scale-105 transition-transform duration-300"
          >
            💡 View Tips
          </button>
          
          <button
            onClick={() => {
              if (spendingInfo) {
                const summary = `Current Spending Summary:

📅 Daily: ${spendingInfo.dailySpent}/${spendingInfo.dailyLimit} XLM (${getProgressPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit).toFixed(1)}%)
📊 Monthly: ${spendingInfo.monthlySpent}/${spendingInfo.monthlyLimit} XLM (${getProgressPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit).toFixed(1)}%)
🔒 Status: ${spendingInfo.isFrozen ? 'FROZEN' : 'ACTIVE'}`;
                alert(summary);
              }
            }}
            className="kiro-btn kiro-btn-primary hover:scale-105 transition-transform duration-300"
          >
            📋 View Summary
          </button>
        </div>
      </div>

      {/* Information */}
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-gradient-modern">ℹ️ How Spending Limits Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">🛡️ Security Benefits</h4>
            <ul className="space-y-1">
              <li>• Prevents unauthorized large transactions</li>
              <li>• Helps control spending habits</li>
              <li>• Automatic enforcement on all transactions</li>
              <li>• Cannot be bypassed once set</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">⏰ Reset Schedule</h4>
            <ul className="space-y-1">
              <li>• Daily limits reset at midnight UTC</li>
              <li>• Monthly limits reset on the 1st of each month</li>
              <li>• Counters can be manually reset anytime</li>
              <li>• Limits persist until manually changed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
