import React, { createContext, useContext, useState, useCallback } from 'react'
import { blockchainService } from '../services/blockchain'
import { dataVaultService } from '../services/dataVault'
import { consentService } from '../services/consent'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null) // 'professional' | 'patient'

  const login = useCallback((email, userRole) => {
    const u = { id: crypto.randomUUID().slice(0, 8), email, name: email.split('@')[0] }
    setUser(u)
    setRole(userRole)
    return u
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setRole(null)
  }, [])

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        login,
        logout,
        blockchain: blockchainService,
        dataVault: dataVaultService,
        consent: consentService,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
