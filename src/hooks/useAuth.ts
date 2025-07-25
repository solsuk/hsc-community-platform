import { useState, useEffect } from 'react'

export interface User {
  id: string
  email: string
  communityVerified: boolean
  isAdmin: boolean
  loginTime: string
}

export interface AuthState {
  user: User | null
  authenticated: boolean
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    authenticated: false,
    loading: true
  })

  // Check authentication status
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      
      setAuthState({
        user: data.user,
        authenticated: data.authenticated,
        loading: false
      })
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthState({
        user: null,
        authenticated: false,
        loading: false
      })
    }
  }

  // Send magic link
  const sendMagicLink = async (email: string) => {
    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link')
      }

      return data
    } catch (error) {
      console.error('Magic link error:', error)
      throw error
    }
  }

  // Logout
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })

      setAuthState({
        user: null,
        authenticated: false,
        loading: false
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Listen for auth state changes (e.g., when user logs in via magic link)
  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      if (!authState.loading) {
        checkAuth()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [authState.loading])

  return {
    ...authState,
    sendMagicLink,
    logout,
    refreshAuth: checkAuth
  }
} 