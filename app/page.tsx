'use client'

import { useState } from 'react'
import WalletHeader from '@/components/WalletHeader'
import Navbar from '@/components/Navbar'
import Dashboard from '@/components/pages/Dashboard'
import Chat from '@/components/pages/Chat'
import Contacts from '@/components/pages/Contacts'
import SpendingLimits from '@/components/pages/SpendingLimits'
import Security from '@/components/pages/Security'
import SmartContracts from '@/components/pages/SmartContracts'
import Analytics from '@/components/pages/Analytics'
import Help from '@/components/pages/Help'
import { useAppContext } from '@/contexts/AppContext'

// Mobile bottom nav items
const mobileNav = [
  { id: 'dashboard', label: 'Home', icon: '🏠' },
  { id: 'chat', label: 'Chat', icon: '🤖' },
  { id: 'contacts', label: 'Contacts', icon: '👥' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'help', label: 'Help', icon: '❓' },
]

export default function Home() {
  const { state, setActiveTab } = useAppContext()
  const { publicKey, activeTab } = state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const renderPage = () => {
    if (!publicKey) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-screen px-4 py-8">
          <div className="text-center space-y-8 max-w-4xl w-full animate-slide-in-up">
            <div className="space-y-3">
              <div className="text-5xl animate-float-gentle">🤖</div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">AI Wallet Manager</h1>
              <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
                Manage your Stellar wallet with natural language. Just type what you want to do.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {[
                { icon: '🤖', title: 'AI Assistant', desc: 'Natural language commands for seamless wallet management' },
                { icon: '🔒', title: 'Smart Security', desc: 'Spending limits and wallet freeze protection' },
                { icon: '📊', title: 'Analytics', desc: 'Transaction insights and portfolio tracking' },
              ].map((item, i) => (
                <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/15 rounded-2xl p-6 text-center hover:scale-105 transition-all duration-300" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'dashboard':   return <Dashboard />
      case 'chat':        return <Chat />
      case 'contacts':    return <Contacts />
      case 'spending':    return <SpendingLimits />
      case 'security':    return <Security />
      case 'contracts':   return <SmartContracts />
      case 'analytics':   return <Analytics />
      case 'help':        return <Help />
      default:            return <Dashboard />
    }
  }

  const isLoggedIn = !!publicKey

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-black via-gray-900 to-black modern-mesh-bg">

      {/* ── Desktop Sidebar ── */}
      {isLoggedIn && (
        <div className="hidden md:block flex-shrink-0">
          <Navbar activeTab={activeTab} onTabChange={setActiveTab} publicKey={publicKey} />
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header — only on dashboard or when not logged in */}
        {(!isLoggedIn || activeTab === 'dashboard') && (
          <div className="border-b border-white/10 backdrop-blur-xl bg-gradient-to-r from-white/5 via-black/10 to-white/5">
            <div className="p-4 sm:p-6">
              <WalletHeader />
            </div>
          </div>
        )}

        {/* Mobile top bar — show on non-dashboard pages when logged in */}
        {isLoggedIn && activeTab !== 'dashboard' && (
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 backdrop-blur-xl bg-black/50">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/10 text-white text-lg"
            >
              ☰
            </button>
            <span className="text-white font-semibold capitalize">{activeTab.replace('_', ' ')}</span>
            <div className="w-10" />
          </div>
        )}

        {/* Mobile slide-out menu */}
        {mobileMenuOpen && isLoggedIn && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 bg-gray-900 border-r border-white/15 h-full overflow-y-auto">
              <Navbar
                activeTab={activeTab}
                onTabChange={(tab) => { setActiveTab(tab); setMobileMenuOpen(false) }}
                publicKey={publicKey}
              />
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className={`flex-1 overflow-auto ${isLoggedIn ? 'p-4 sm:p-6 pb-20 md:pb-6' : 'p-0'}`}>
          <div className={`${isLoggedIn ? 'max-w-7xl mx-auto' : 'w-full'}`}>
            {renderPage()}
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      {isLoggedIn && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-black/80 border-t border-white/15">
          <div className="flex items-center justify-around px-2 py-2">
            {mobileNav.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-white/15 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
