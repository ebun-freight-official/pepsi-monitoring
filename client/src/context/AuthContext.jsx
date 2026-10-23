import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider ({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function boot () {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const data = await api.get('/users/current-user')
        setUser(data.user)
      } catch {
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    boot()
  }, [])

  const login = async (email, password) => {
    const data = await api.post('/users/login', { email, password })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async payload => {
    return api.post('/users/register', payload)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAdmin: user?.role === 'admin',
        isSalesAgent: user?.role === 'sales_agent',
        isVisitor: user?.role === 'visitor',
        canManage: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
