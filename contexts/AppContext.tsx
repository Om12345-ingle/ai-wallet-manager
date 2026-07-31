'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react'

interface Contact {
  name: string
  address: string
  isTrusted?: boolean
}

interface SpendingInfo {
  dailyLimit: number
  monthlyLimit: number
  dailySpent: number
  monthlySpent: number
  isFrozen: boolean
}

interface AppState {
  // Wallet State
  publicKey: string
  secretKey: string
  balance: string
  
  // Navigation State
  activeTab: string
  
  // Spending Limits State
  spendingInfo: SpendingInfo
  
  // Contacts State
  contacts: Contact[]
  
  // Security State
  walletStatus: 'active' | 'frozen'
}

interface AppContextType {
  state: AppState
  updateWalletKeys: (publicKey: string, secretKey?: string) => void
  updateBalance: (balance: string) => void
  setActiveTab: (tab: string) => void
  updateSpendingInfo: (info: Partial<SpendingInfo>) => void
  addContact: (contact: Contact) => void
  removeContact: (name: string) => void
  updateContact: (name: string, updates: Partial<Contact>) => void
  setWalletStatus: (status: 'active' | 'frozen') => void
  resetState: () => void
}

const defaultState: AppState = {
  publicKey: '',
  secretKey: '',
  balance: '0',
  activeTab: 'dashboard',
  spendingInfo: {
    dailyLimit: 1000,
    monthlyLimit: 10000,
    dailySpent: 0,
    monthlySpent: 0,
    isFrozen: false
  },
  contacts: [],
  walletStatus: 'active'
}

const AppContext = createContext<AppContextType | undefined>(undefined)
const validTabs = new Set([
  'dashboard',
  'chat',
  'contacts',
  'spending',
  'security',
  'contracts',
  'analytics',
  'feedback',
  'help',
])

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState)

  // Load general state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('ai-wallet-state')
    const requestedTab = new URLSearchParams(window.location.search).get('tab')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        setState(prevState => ({
          ...prevState,
          activeTab:
            (requestedTab && validTabs.has(requestedTab) && requestedTab) ||
            parsedState.activeTab ||
            prevState.activeTab,
          walletStatus: parsedState.walletStatus || prevState.walletStatus,
          publicKey: '',
          secretKey: '',
          contacts: []
        }))
      } catch (error) {
        console.error('Failed to parse saved state:', error)
      }
    } else if (requestedTab && validTabs.has(requestedTab)) {
      setState(prevState => ({ ...prevState, activeTab: requestedTab }))
    }
  }, [])

  // Save non-sensitive state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      activeTab: state.activeTab,
      walletStatus: state.walletStatus
    }
    localStorage.setItem('ai-wallet-state', JSON.stringify(stateToSave))
  }, [state.activeTab, state.walletStatus])

  const updateWalletKeys = useCallback((publicKey: string, secretKey: string = '') => {
    setState(prevState => {
      let contacts: Contact[] = []
      let spendingInfo = defaultState.spendingInfo

      if (publicKey) {
        const savedContacts = localStorage.getItem(`contacts_${publicKey}`)
        if (savedContacts) {
          try {
            contacts = JSON.parse(savedContacts)
          } catch (e) {
            console.error('Failed to parse saved contacts:', e)
          }
        }
        
        const savedSpending = localStorage.getItem(`spending_${publicKey}`)
        if (savedSpending) {
          try {
            spendingInfo = JSON.parse(savedSpending)
          } catch (e) {
            console.error('Failed to parse saved spending info:', e)
          }
        }
      }

      return {
        ...prevState,
        publicKey,
        secretKey,
        contacts,
        spendingInfo
      }
    })
  }, [])

  const updateBalance = useCallback((balance: string) => {
    setState(prevState => ({
      ...prevState,
      balance
    }))
  }, [])

  const setActiveTab = useCallback((tab: string) => {
    if (!validTabs.has(tab)) return
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url)
    setState(prevState => ({
      ...prevState,
      activeTab: tab
    }))
  }, [])

  const updateSpendingInfo = useCallback((info: Partial<SpendingInfo>) => {
    setState(prevState => {
      const updatedInfo = {
        ...prevState.spendingInfo,
        ...info
      }
      if (prevState.publicKey) {
        localStorage.setItem(`spending_${prevState.publicKey}`, JSON.stringify(updatedInfo))
      }
      return {
        ...prevState,
        spendingInfo: updatedInfo
      }
    })
  }, [])

  const addContact = useCallback((contact: Contact) => {
    setState(prevState => {
      const updatedContacts = [...prevState.contacts.filter(c => c.name !== contact.name), contact]
      if (prevState.publicKey) {
        localStorage.setItem(`contacts_${prevState.publicKey}`, JSON.stringify(updatedContacts))
      }
      return {
        ...prevState,
        contacts: updatedContacts
      }
    })
  }, [])

  const removeContact = useCallback((name: string) => {
    setState(prevState => {
      const updatedContacts = prevState.contacts.filter(c => c.name !== name)
      if (prevState.publicKey) {
        localStorage.setItem(`contacts_${prevState.publicKey}`, JSON.stringify(updatedContacts))
      }
      return {
        ...prevState,
        contacts: updatedContacts
      }
    })
  }, [])

  const updateContact = useCallback((name: string, updates: Partial<Contact>) => {
    setState(prevState => {
      const updatedContacts = prevState.contacts.map(contact =>
        contact.name === name ? { ...contact, ...updates } : contact
      )
      if (prevState.publicKey) {
        localStorage.setItem(`contacts_${prevState.publicKey}`, JSON.stringify(updatedContacts))
      }
      return {
        ...prevState,
        contacts: updatedContacts
      }
    })
  }, [])

  const setWalletStatus = useCallback((status: 'active' | 'frozen') => {
    setState(prevState => {
      const updatedInfo = {
        ...prevState.spendingInfo,
        isFrozen: status === 'frozen'
      }
      if (prevState.publicKey) {
        localStorage.setItem(`spending_${prevState.publicKey}`, JSON.stringify(updatedInfo))
      }
      return {
        ...prevState,
        walletStatus: status,
        spendingInfo: updatedInfo
      }
    })
  }, [])

  const resetState = useCallback(() => {
    if (state.publicKey) {
      localStorage.removeItem(`contacts_${state.publicKey}`)
      localStorage.removeItem(`spending_${state.publicKey}`)
      localStorage.removeItem(`chat_history_${state.publicKey}`)
    }
    
    setState(defaultState)
    localStorage.removeItem('ai-wallet-state')
  }, [state.publicKey])

  const contextValue = useMemo<AppContextType>(() => ({
    state,
    updateWalletKeys,
    updateBalance,
    setActiveTab,
    updateSpendingInfo,
    addContact,
    removeContact,
    updateContact,
    setWalletStatus,
    resetState
  }), [
    state,
    updateWalletKeys,
    updateBalance,
    setActiveTab,
    updateSpendingInfo,
    addContact,
    removeContact,
    updateContact,
    setWalletStatus,
    resetState,
  ])

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export default AppContext
