'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/AppContext'
import { connectWallet as connectFreighterWallet, isWalletInstalled } from '@/lib/freighterWallet'


export default function WalletLoginForm() {
  const { updateWalletKeys } = useAppContext()
  const [publicKey, setPublicKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false);
  const isMainnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'

  const generateKeys = async () => {
    try {
      const response = await fetch('/api/stellar/generate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok && data.publicKey && data.secretKey) {
        setPublicKey(data.publicKey)
        setSecretKey(data.secretKey)
      } else {
        throw new Error(data.error || 'Could not generate a testnet keypair.')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not generate a testnet keypair.')
    }
  }

  const connectWallet = () => {
    setError(null)
    
    if (!publicKey || !secretKey) {
      setError('Please enter both keys or generate new ones')
      return
    }

    // Basic validation
    if (!publicKey.startsWith('G') || publicKey.length !== 56) {
      setError('Invalid public key format')
      return
    }
    
    if (!secretKey.startsWith('S') || secretKey.length !== 56) {
      setError('Invalid secret key format')
      return
    }

    updateWalletKeys(publicKey, secretKey)
    localStorage.setItem('connectedWalletType', 'manual')
    localStorage.setItem('connectedWalletName', 'Manual Entry')
  }

  const connectWatchOnly = () => {
    setError(null)
    if (!publicKey.startsWith('G') || publicKey.length !== 56) {
      setError('Enter a valid 56-character Stellar public address for watch-only access.')
      return
    }
    updateWalletKeys(publicKey, '')
    localStorage.setItem('connectedWalletType', 'watch-only')
    localStorage.setItem('connectedWalletName', 'Watch-Only Address')
  }

  const quickStart = async () => {
    setConnecting(true)
    
    try {
      const response = await fetch('/api/stellar/generate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok && data.publicKey && data.secretKey) {
        // Immediately connect with the generated keys
        updateWalletKeys(data.publicKey, data.secretKey)
        localStorage.setItem('connectedWalletType', 'manual')
        localStorage.setItem('connectedWalletName', 'Generated Keys')
      } else {
        throw new Error('Failed to generate keys')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate keys')
    } finally {
      setConnecting(false)
    }
  }

  const tryFreighter = async () => {
    setConnecting(true)
    setError(null)

    try {
      // Check if Freighter is installed
      const installed = await isWalletInstalled()
      if (!installed) {
        throw new Error('Freighter extension not found. Please install Freighter extension and open it once.')
      }

      // Use our improved connection function
      const freighterPublicKey = await connectFreighterWallet()
      
      if (freighterPublicKey) {
        updateWalletKeys(freighterPublicKey, '')
        localStorage.setItem('connectedWalletType', 'freighter')
        localStorage.setItem('connectedWalletName', 'Freighter Wallet')
      } else {
        throw new Error('Failed to connect to Freighter wallet. Please try again.')
      }
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Connect Your Wallet</h3>
        <p className="text-base text-gray-400 max-w-md mx-auto">
          Choose how you'd like to authenticate with Stellar {isMainnet ? 'Mainnet' : 'Testnet'}
        </p>
      </div>

      {error && (
        <div aria-live="polite" className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-center animate-fade-in-scale font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Connection Options */}
      <div className="grid gap-6">
        {/* Quick Start - Only in Testnet Sandbox */}
        {!isMainnet && (
          <button
            onClick={quickStart}
            disabled={connecting}
            className="p-8 rounded-3xl border transition-all duration-500 hover:scale-[1.02] bg-gradient-to-br from-yellow-500/5 via-black/10 to-yellow-500/5 border-yellow-500/25 hover:border-yellow-500/50 shadow-lg relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="text-center relative z-10">
              <div className="text-5xl mb-4 animate-bounce" style={{ animationDuration: '3s' }}>⚡</div>
              <h4 className="text-2xl font-bold text-white mb-2 tracking-tight">Quick Start</h4>
              <p className="text-gray-400 mb-4 max-w-sm mx-auto text-sm leading-relaxed">
                Generate new testnet credentials and connect your dashboard instantly.
              </p>
              {connecting ? (
                <div className="text-yellow-400 font-semibold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
                  Generating Secure Credentials…
                </div>
              ) : (
                <div className="inline-block text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-bold uppercase tracking-wider">
                  ⚡ Recommended for Sandbox Testing
                </div>
              )}
            </div>
          </button>
        )}

        {/* Freighter Option */}
        <button
          onClick={tryFreighter}
          disabled={connecting}
          className="min-w-0 p-6 rounded-3xl border transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-yellow-500/5 via-black/10 to-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/10 shadow-md flex items-center justify-between group"
        >
          <div className="min-w-0 flex items-center gap-4">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">🚀</div>
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-lg font-bold text-white">Freighter Wallet</h4>
              <p className="text-sm text-gray-400">
                {connecting ? 'Checking Status…' : 'Authorize using your Freighter browser extension'}
              </p>
            </div>
          </div>
          <div className="text-white/60 text-lg group-hover:translate-x-1 transition-transform duration-300">
            {connecting ? '⏳' : '→'}
          </div>
        </button>

        {/* Manual Entry */}
        <div className={`kiro-card space-y-6 transition-all duration-500 border ${publicKey && secretKey ? 'border-yellow-500/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'border-white/10'}`}>
          <div className="text-center">
            <div className="text-4xl mb-3">🔑</div>
            <h4 className="text-xl font-bold text-white mb-1">Manual Account Entry</h4>
            <p className="text-sm text-gray-400">Authenticate with existing Stellar keys</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="manual-public-key" className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                Public Key (Address)
              </label>
              <input
                type="text"
                id="manual-public-key"
                name="publicKey"
                autoComplete="off"
                spellCheck={false}
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="min-w-0 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-yellow-500/40 transition-all duration-300"
              />
            </div>

            <div>
              <label htmlFor="manual-secret-key" className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                Secret Seed Key
              </label>
              <input
                type="password"
                id="manual-secret-key"
                name="secretKey"
                autoComplete="off"
                spellCheck={false}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="min-w-0 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-yellow-500/40 transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={connectWallet}
              disabled={!publicKey || !secretKey || connecting}
              className="flex-1 py-3 px-6 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-300 font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              🚀 Connect Credentials
            </button>
            {!isMainnet && (
              <button
                onClick={generateKeys}
                disabled={connecting}
                className="py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
              >
                🎲 Generate New Pair
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={connectWatchOnly}
            disabled={!publicKey || connecting}
            className="w-full rounded-xl border border-blue-400/20 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            👁 Open Watch-Only — No Secret Seed Required
          </button>
          <p className="text-center text-xs leading-5 text-gray-500">
            Watch-only mode can view balances, analytics and proof. It cannot sign transactions.
          </p>
        </div>
      </div>

      {/* Network/Sandbox Info */}
      <div className="text-center">
        {!isMainnet ? (
          <div className="kiro-card p-6 border border-white/10 bg-gradient-to-b from-white/5 to-black/30">
            <div className="flex items-center gap-3 justify-center mb-3">
              <div className="relative">
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 block animate-pulse"></span>
                <span className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping opacity-75"></span>
              </div>
              <p className="font-bold text-sm text-white tracking-wide uppercase">🧪 Sandbox Environment</p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl mx-auto">
              This app is connected exclusively to the Stellar Testnet. 
              All funds are mock XLM issued by Friendbot and hold no real monetary value.
            </p>
          </div>
        ) : (
          <div className="kiro-card p-6 border border-yellow-500/20 bg-gradient-to-b from-yellow-500/5 to-black/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
            <div className="flex items-center gap-3 justify-center mb-3">
              <div className="relative">
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 block animate-pulse"></span>
                <span className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-yellow-400 animate-ping opacity-75"></span>
              </div>
              <p className="font-bold text-sm text-yellow-400 tracking-wide uppercase">🛡️ Secure Mainnet Connection</p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl mx-auto">
              Connecting to the live, production Stellar Network. Verify transaction details before signing. 
              We never store your private keys on our servers.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
