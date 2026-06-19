'use client'

import { useState, useEffect } from 'react'
import TransactionHistory from '../TransactionHistory'
import { useAppContext } from '@/contexts/AppContext'

interface Asset {
  code: string
  name: string
  balance: number
  priceXLM: number
  valueXLM: number
  icon: string
  change24h?: number
}

interface Portfolio {
  assets: { [key: string]: Asset }
  totalValueXLM: number
}

export default function Analytics() {
  const { state } = useAppContext()
  const { publicKey, secretKey } = state
  
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [spendingInfo, setSpendingInfo] = useState<any>(null)
  const [balance, setBalance] = useState<string>('0')
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [history, setHistory] = useState<any[]>([])
  
  // Interactive chart state
  const [hoveredAsset, setHoveredAsset] = useState<Asset | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // 1. Get spending analytics
      const analyticsResponse = await fetch('/api/stellar/smart-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_spending_analytics',
          publicKey,
          secretKey
        })
      })
      const analyticsData = await analyticsResponse.json()
      if (analyticsResponse.ok && analyticsData.analytics) {
        setAnalytics(analyticsData.analytics)
      }

      // 2. Get spending limit info
      const spendingResponse = await fetch('/api/stellar/smart-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_spending_info',
          publicKey,
          secretKey
        })
      })
      const spendingData = await spendingResponse.json()
      if (spendingResponse.ok && spendingData.spendingInfo) {
        setSpendingInfo(spendingData.spendingInfo)
      }

      // 3. Get XLM balance
      const balanceResponse = await fetch('/api/stellar/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey })
      })
      const balanceData = await balanceResponse.json()
      if (balanceData.balance !== undefined) {
        setBalance(balanceData.balance)
      }

      // 4. Get multi-asset portfolio
      const portfolioResponse = await fetch('/api/stellar/multi-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_portfolio',
          publicKey,
          secretKey
        })
      })
      const portfolioData = await portfolioResponse.json()
      if (portfolioResponse.ok && portfolioData.portfolio) {
        setPortfolio(portfolioData.portfolio)
      }

      // 5. Get recent transaction history
      const historyResponse = await fetch('/api/stellar/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey })
      })
      const historyData = await historyResponse.json()
      if (historyResponse.ok && historyData.transactions) {
        setHistory(historyData.transactions.slice(0, 10).reverse()) // Last 10, chronological
      }

    } catch (error) {
      console.error('Error fetching analytics details:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (publicKey) {
      fetchAnalytics()
    }
  }, [publicKey])

  const getSpendingPercentage = (spent: number, limit: number) => {
    if (!limit || limit <= 0) return 0
    return Math.min((spent / limit) * 100, 100)
  }

  const getHealthScore = () => {
    if (!spendingInfo) return 0
    
    let score = 100
    const dailyUsage = getSpendingPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit)
    const monthlyUsage = getSpendingPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit)
    
    if (dailyUsage > 90) score -= 30
    else if (dailyUsage > 70) score -= 20
    else if (dailyUsage > 50) score -= 10
    
    if (monthlyUsage > 90) score -= 30
    else if (monthlyUsage > 70) score -= 20
    else if (monthlyUsage > 50) score -= 10
    
    if (spendingInfo.isFrozen) score -= 40
    
    return Math.max(score, 0)
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getHealthStatus = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Locked / Stressed'
  }

  const healthScore = getHealthScore()

  // Donut Chart Math
  const CIRCUMFERENCE = 439.82 // 2 * pi * r (r=70)
  const getDonutSegments = () => {
    if (!portfolio || portfolio.totalValueXLM <= 0) return []
    
    const assets = Object.values(portfolio.assets)
    let cumulativePercent = 0
    
    // Curated color map
    const colorMap: { [key: string]: string } = {
      'XLM': '#8b5cf6',   // Violet
      'USDC': '#06b6d4',  // Cyan
      'EURC': '#10b981',  // Emerald
      'AQUA': '#f43f5e',  // Rose
      'YBX': '#fbbf24'    // Amber
    }

    return assets.map(asset => {
      const value = asset.valueXLM || 0
      const percentage = (value / portfolio.totalValueXLM) * 100
      const strokeDash = (percentage / 100) * CIRCUMFERENCE
      const strokeOffset = CIRCUMFERENCE - (cumulativePercent / 100) * CIRCUMFERENCE
      cumulativePercent += percentage

      return {
        asset,
        percentage,
        strokeDash,
        strokeOffset,
        color: colorMap[asset.code] || '#6b7280'
      }
    })
  }

  const donutSegments = getDonutSegments()

  // Line Chart Math (SVG viewport: width=500, height=160)
  const getLineChartPoints = () => {
    if (history.length === 0) return { linePath: '', areaPath: '', points: [] }
    
    const validTxs = history.filter(tx => tx.amount && !isNaN(parseFloat(tx.amount)))
    if (validTxs.length === 0) return { linePath: '', areaPath: '', points: [] }

    const amounts = validTxs.map(tx => parseFloat(tx.amount))
    const maxAmount = Math.max(...amounts, 1) // Avoid divide by 0
    
    const width = 500
    const height = 160
    const paddingLeft = 35
    const paddingRight = 15
    const paddingTop = 25
    const paddingBottom = 20
    
    const plotWidth = width - paddingLeft - paddingRight
    const plotHeight = height - paddingTop - paddingBottom
    
    const points = validTxs.map((tx, idx) => {
      const amount = parseFloat(tx.amount)
      const x = (idx / (validTxs.length - 1 || 1)) * plotWidth + paddingLeft
      const ratio = amount / maxAmount
      const y = height - paddingBottom - ratio * plotHeight
      return { x, y, tx, amount }
    })

    // Construct path strings
    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`

    return { linePath, areaPath, points }
  }

  const { linePath, areaPath, points: chartPoints } = getLineChartPoints()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 p-6 animate-fade-in-scale">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-extrabold kiro-text-gradient">📊 Financial Analytics</h1>
            <p className="text-sm text-gray-400 mt-1">Real-time asset allocations, transaction trends, and contract metrics</p>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? '⏳ Updating...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>

      {/* Grid: Donut Chart & Spending Limit gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Chart: Asset Allocation */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 p-6 flex flex-col md:flex-row items-center gap-8 min-h-[320px]">
          <div className="relative flex-shrink-0 w-48 h-48 md:w-56 md:h-56">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {/* Background circle trace */}
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
              
              {donutSegments.map((seg, idx) => (
                <circle
                  key={idx}
                  cx="100"
                  cy="100"
                  r="70"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={`${seg.strokeDash} ${CIRCUMFERENCE}`}
                  strokeDashoffset={seg.strokeOffset}
                  strokeLinecap="round"
                  className="donut-segment"
                  style={{
                    transformOrigin: 'center',
                    filter: hoveredAsset === seg.asset ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                    opacity: hoveredAsset && hoveredAsset !== seg.asset ? 0.3 : 1
                  }}
                  onMouseEnter={() => setHoveredAsset(seg.asset)}
                  onMouseLeave={() => setHoveredAsset(null)}
                />
              ))}
            </svg>

            {/* Inner Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
              {hoveredAsset ? (
                <div className="donut-center-text">
                  <p className="text-xl font-bold text-white uppercase">{hoveredAsset.code}</p>
                  <p className="text-base font-semibold text-gray-300">{hoveredAsset.balance.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">≈ ${(hoveredAsset.valueXLM * 0.12).toFixed(2)} USD</p>
                </div>
              ) : (
                <div className="donut-center-text">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Value</p>
                  <p className="text-xl font-extrabold text-white">
                    {portfolio ? `${portfolio.totalValueXLM.toFixed(2)}` : `${parseFloat(balance).toFixed(2)}`}
                  </p>
                  <p className="text-sm font-semibold text-violet-400">XLM</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ≈ ${((portfolio ? portfolio.totalValueXLM : parseFloat(balance)) * 0.12).toFixed(2)} USD
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="flex-1 w-full space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">Asset Allocation</h3>
            {portfolio ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {donutSegments.map((seg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all duration-300 ${
                      hoveredAsset === seg.asset 
                        ? 'bg-white/10 border border-white/20' 
                        : 'bg-white/5 border border-transparent'
                    }`}
                    onMouseEnter={() => setHoveredAsset(seg.asset)}
                    onMouseLeave={() => setHoveredAsset(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-sm font-bold text-white">{seg.asset.code}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-300 block">{seg.percentage.toFixed(1)}%</span>
                      <span className="text-[10px] text-gray-500 font-mono">{seg.asset.balance.toFixed(2)} units</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Loading allocation segments...</p>
            )}
          </div>
        </div>

        {/* Dynamic Concentric spending limit Progress Rings */}
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 p-6 flex flex-col justify-between min-h-[320px]">
          <div>
            <h3 className="text-base font-bold text-white">🔒 Smart Spending Limits</h3>
            <p className="text-xs text-gray-400 mt-1">Status of on-chain spending threshold rules</p>
          </div>

          {spendingInfo ? (
            <div className="flex items-center justify-center gap-6 my-4">
              {/* Daily Circle */}
              <div className="text-center space-y-2">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(6,182,212,0.1)" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#06b6d4"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * getSpendingPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit)) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-bold text-cyan-400">
                      {getSpendingPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit).toFixed(0)}%
                    </span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest">Daily</span>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="text-white font-semibold font-mono block">{spendingInfo.dailySpent} XLM</span>
                  <span className="text-gray-400">Limit: {spendingInfo.dailyLimit}</span>
                </div>
              </div>

              {/* Monthly Circle */}
              <div className="text-center space-y-2">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(139,92,246,0.1)" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#8b5cf6"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * getSpendingPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit)) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-bold text-purple-400">
                      {getSpendingPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit).toFixed(0)}%
                    </span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest">Monthly</span>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="text-white font-semibold font-mono block">{spendingInfo.monthlySpent} XLM</span>
                  <span className="text-gray-400">Limit: {spendingInfo.monthlyLimit}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-gray-400">Spending limits not loaded.</div>
          )}

          <div className="text-center text-xs text-gray-400 border-t border-white/10 pt-2 font-medium">
            {spendingInfo && !spendingInfo.isFrozen ? (
              <span className="text-green-400">✅ Spending counters active on-chain</span>
            ) : (
              <span className="text-red-400">🚨 Wallet is currently FROZEN</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Visual Line Chart (Tx History) & Wallet Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Area Chart: Recent Transaction Sizes */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 p-6 min-h-[250px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">📈 Recent Activity Flow</h3>
              <p className="text-xs text-gray-400 mt-1">Transaction size (XLM value) trend over last 10 actions</p>
            </div>
            {hoveredPoint && (
              <div className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-white animate-fade-in-scale">
                <span className="font-bold">{hoveredPoint.tx.type}</span>: <span className="font-mono text-violet-400">{hoveredPoint.amount} XLM</span>
              </div>
            )}
          </div>

          <div className="relative flex-1 min-h-[160px] mt-4">
            {history.length > 0 ? (
              <svg viewBox="0 0 500 160" width="100%" height="100%" className="overflow-visible">
                <defs>
                  {/* Area fill gradient */}
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                <line x1="35" y1="25" x2="485" y2="25" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <line x1="35" y1="75" x2="485" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <line x1="35" y1="125" x2="485" y2="125" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <line x1="35" y1="140" x2="485" y2="140" stroke="rgba(255,255,255,0.15)" />

                {/* Shaded Area */}
                {areaPath && (
                  <path d={areaPath} fill="url(#areaGrad)" />
                )}

                {/* Plot Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    className="chart-line-path"
                  />
                )}

                {/* Highlight Nodes */}
                {chartPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    className="chart-node"
                    style={{ filter: hoveredPoint?.tx === pt.tx ? 'drop-shadow(0 0 5px #8b5cf6)' : 'none' }}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                No recent transaction sizes to plot.
              </div>
            )}
          </div>
        </div>

        {/* Wallet Health Rating */}
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 p-6 flex flex-col justify-between min-h-[250px]">
          <div>
            <h3 className="text-base font-bold text-white">🏥 Wallet Health Rating</h3>
            <p className="text-xs text-gray-400 mt-1">Audit status of limit thresholds and freeze locks</p>
          </div>

          <div className="text-center my-4">
            <div className={`text-6xl font-black ${getHealthColor(healthScore)} filter drop-shadow-md`}>
              {healthScore}
            </div>
            <div className="text-sm font-semibold text-white mt-1">Health Score</div>
            <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 bg-white/5 border border-white/10 ${getHealthColor(healthScore)}`}>
              {getHealthStatus(healthScore)}
            </div>
          </div>

          <div className="space-y-1 text-[11px] text-gray-400 border-t border-white/10 pt-2">
            {healthScore >= 80 ? (
              <p>💚 Excellent security config! All limits are within safe margins.</p>
            ) : healthScore >= 60 ? (
              <p>⚠️ Alert: Moderate limit utilization. Monitor daily transactions.</p>
            ) : (
              <p>🚨 Action Required: High spending usage or active wallet freeze locked.</p>
            )}
          </div>
        </div>
      </div>

      {/* Ledger History List */}
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📋</span> Ledger History Log
          </h3>
          <span className="text-xs text-gray-400 font-mono">Last 10 on-chain records</span>
        </div>
        <TransactionHistory publicKey={publicKey} />
      </div>

      {/* Interactive Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <button
          onClick={() => {
            if (spendingInfo) {
              const text = `📊 Wallet Status Report:\n\n` +
                `• Current Balance: ${parseFloat(balance).toFixed(2)} XLM\n` +
                `• Daily Limit: ${spendingInfo.dailySpent} / ${spendingInfo.dailyLimit} XLM\n` +
                `• Monthly Limit: ${spendingInfo.monthlySpent} / ${spendingInfo.monthlyLimit} XLM\n` +
                `• Freeze status: ${spendingInfo.isFrozen ? 'FROZEN LOCK' : 'ACTIVE'}\n` +
                `• Total Ledger Tx Count: ${analytics?.totalTransactions || 0}\n` +
                `• Wallet Health Index: ${healthScore}/100`;
              alert(text);
            }
          }}
          className="py-4 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
        >
          📋 Export Diagnostic Report
        </button>

        <button
          onClick={() => {
            alert(`💡 Visual Analytics tips:\n\n` +
              `1. Hover Donut Slices: Hovering slices in the allocation chart breaks down individual asset values.\n` +
              `2. Track Activity Peaks: High nodes in the activity graph show transaction spikes.\n` +
              `3. Optimize Limits: Keep concentric limit metrics under 70% to maintain green health index ratings.`);
          }}
          className="py-4 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
        >
          💡 Visual Interactive Guides
        </button>

        <button
          onClick={async () => {
            if (!confirm("Are you sure you want to reset all daily/monthly limits back to zero?")) return
            try {
              const response = await fetch('/api/stellar/smart-limit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'reset_spending_limits',
                  publicKey,
                  secretKey
                })
              });
              
              if (response.ok) {
                alert('✅ Spending limits have been reset.');
                fetchAnalytics();
              } else {
                throw new Error('Failed to reset');
              }
            } catch (error) {
              alert('❌ Failed to reset spending counters.');
            }
          }}
          className="py-4 px-6 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
        >
          🔄 Reset Spending Counters
        </button>
      </div>
    </div>
  )
}