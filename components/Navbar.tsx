'use client'

import { useState } from 'react'

interface NavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  publicKey: string
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'chat', label: 'AI Chat', icon: '🤖' },
  { id: 'contacts', label: 'Contacts', icon: '👥' },
  { id: 'spending', label: 'Spending Limits', icon: '💰' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'contracts', label: 'Smart Contracts', icon: '📋' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'help', label: 'Help', icon: '❓' }
]

export default function Navbar({ activeTab, onTabChange, publicKey }: NavbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isMainnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'

  return (
    <nav className="backdrop-blur-xl bg-gradient-to-b from-white/10 via-black/20 to-white/5 border-r border-white/20 h-screen sticky top-0 transition-all duration-500 z-50 shadow-2xl">
      <div className={`${isCollapsed ? 'w-20' : 'w-72'} transition-all duration-500 h-full flex flex-col`}>
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="animate-fade-in-scale">
                <h1 className="text-2xl font-bold text-white">AI Wallet</h1>
                <p className="text-sm text-gray-400 mt-1">Stellar Manager</p>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="kiro-btn-ghost p-3 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-110"
            >
              <span className="text-lg">{isCollapsed ? '→' : '←'}</span>
            </button>
          </div>
        </div>

        {/* User Info */}
        {publicKey && (
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-black/30 to-yellow-500/5 border border-yellow-500/20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-xl">👤</span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black animate-pulse ${isMainnet ? 'bg-yellow-500' : 'bg-green-400'}`}></div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-fade-in-scale">
                  <p className="text-sm font-semibold text-white truncate">Wallet Connected</p>
                  <p className="text-xs text-gray-400 truncate font-mono bg-white/5 px-2 py-1 rounded-lg mt-1 border border-white/5">
                    {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-yellow-500/10 via-black/20 to-yellow-500/5 border border-yellow-500/35 shadow-lg shadow-yellow-500/5'
                  : 'hover:bg-white/5 hover:border hover:border-white/20 hover:shadow-lg hover:scale-105'
              }`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className={`text-xl flex-shrink-0 transition-transform duration-300 ${
                activeTab === item.id ? 'scale-110 text-yellow-400' : 'group-hover:scale-110'
              }`}>
                {item.icon}
              </div>
              {!isCollapsed && (
                <>
                  <span className={`text-sm font-medium truncate transition-colors duration-300 ${
                    activeTab === item.id ? 'text-yellow-400 font-semibold' : 'text-white group-hover:text-gray-200'
                  }`}>
                    {item.label}
                  </span>
                  {activeTab === item.id && (
                    <div className="ml-auto flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isMainnet ? 'bg-yellow-500 shadow-[0_0_8px_rgba(212,175,55,0.8)]' : 'bg-green-400'} animate-pulse`}></div>
                      <div className="w-1 h-1 rounded-full bg-yellow-600 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    </div>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center justify-center">
            {!isCollapsed ? (
              <div className="text-center animate-fade-in-scale">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${isMainnet ? 'bg-yellow-500' : 'bg-green-400'} animate-pulse`}></div>
                    <div className={`absolute inset-0 w-3 h-3 rounded-full ${isMainnet ? 'bg-yellow-500' : 'bg-green-400'} animate-ping opacity-75`}></div>
                  </div>
                  <span className={`text-xs font-semibold tracking-wider ${isMainnet ? 'text-yellow-400' : 'text-green-400'}`}>
                    {isMainnet ? 'MAINNET' : 'TESTNET'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">Kiro AI Wallet v1.0</p>
                <div className="mt-2 flex justify-center space-x-1">
                  <div className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse"></div>
                  <div className="w-1 h-1 rounded-full bg-yellow-600 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${isMainnet ? 'bg-yellow-500' : 'bg-green-400'} animate-pulse`}></div>
                <div className={`absolute inset-0 w-3 h-3 rounded-full ${isMainnet ? 'bg-yellow-500' : 'bg-green-400'} animate-ping opacity-75`}></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}