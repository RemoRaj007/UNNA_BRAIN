import { createContext, useState, useContext, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('authToken'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (token) {
          // Get current user info
          const response = await fetch('/api/v1/auth/session', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else {
            // Token invalid
            localStorage.removeItem('authToken')
            setToken(null)
            setUser(null)
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        // In development, allow mock user
        if (!token) {
          setUser({
            sub: 'test-user',
            email: 'test@example.com',
            roles: ['Analyst', 'Admin']
          })
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [token])

  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const userData = await response.json()
      setUser(userData)
      setToken(userData.token || 'mock-token')
      localStorage.setItem('authToken', userData.token || 'mock-token')
      return userData
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
  }, [])

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
