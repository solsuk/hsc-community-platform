'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoginForm from './LoginForm'

export default function AuthStatus() {
  const { user, authenticated, loading, logout, refreshAuth } = useAuth()
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [expiredQRMessage, setExpiredQRMessage] = useState(false)
  const [email, setEmail] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Check for auth success and expired QR key in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    
    if (urlParams.get('auth') === 'success') {
      // Remove the auth parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      
      // Refresh auth state multiple times to ensure it's updated
      setTimeout(() => refreshAuth(), 100)
      setTimeout(() => refreshAuth(), 500)
      setTimeout(() => refreshAuth(), 1000)
    }
    
    if (urlParams.get('expired') === 'qr_key') {
      setExpiredQRMessage(true)
      // Remove the expired parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      
      // Hide message after 10 seconds
      setTimeout(() => setExpiredQRMessage(false), 10000)
    }
  }, [refreshAuth])

  // Listen for storage events (in case auth state changes in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      refreshAuth()
    }
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshAuth()
      }
    }

        window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshAuth])

  // Handle magic link sending
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Check your email for the magic link! 📧')
        setEmail('')
        // Auto-collapse after 3 seconds
        setTimeout(() => {
          setIsExpanded(false)
          setMessage('')
        }, 3000)
      } else {
        setMessage(data.error || 'Failed to send magic link')
      }
    } catch (error) {
      setMessage('Network error. Please try again.')
    }

    setIsLoading(false)
  }

  // Handle ESC key to close expanded form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
        setEmail('')
        setMessage('')
      }
    }

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExpanded])

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    )
  }

  if (authenticated && user) {
    return (
      <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Active Session"></div>
          <div className="text-sm">
            <div className="font-medium text-green-800">
              {user.email}
            </div>
            <div className="text-xs text-green-600 flex items-center space-x-1">
              {user.communityVerified ? (
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  ✓ Community Member
                </span>
              ) : (
                <span className="text-orange-600 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  ⏳ Pending Approval
                </span>
              )}
              {user.isAdmin && (
                <span className="ml-2 text-blue-600 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  👑 Admin
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="text-xs text-green-700 hover:text-green-900 hover:bg-green-100 px-2 py-1 rounded transition-colors"
          title="Logout"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      {expiredQRMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  🔑 Your HSC Community Key Has Expired
                </h3>
                <p className="mt-1 text-sm text-amber-700">
                  Your QR key is no longer valid. Request a new magic link below to get a fresh 30-day community key.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setExpiredQRMessage(false)}
                  className="inline-flex rounded-md bg-amber-50 p-1.5 text-amber-500 hover:bg-amber-100"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-white hover:text-green-500 border border-green-500 hover:border-green-500 transition-all duration-300 text-sm font-medium shadow-sm"
        >
          Join HSC →
        </button>
      ) : (
        <form onSubmit={handleSendMagicLink} className="relative">
          <div className="flex items-center bg-green-500 rounded-lg border border-green-500 shadow-sm overflow-hidden transition-all duration-300">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-3 py-2 bg-transparent text-white placeholder-green-200 text-sm focus:outline-none min-w-0"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={!email.trim() || isLoading}
              className={`px-3 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-l border-green-400 ${!(!email.trim() || isLoading) ? 'animate-pulse-glow' : ''}`}
            >
              {isLoading ? '...' : 'Get Key 🔑'}
            </button>
          </div>
          
          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false)
              setEmail('')
              setMessage('')
            }}
            className="absolute -top-2 -right-2 bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-gray-600 text-xs z-10"
          >
            ×
          </button>
          
          {/* Message display */}
          {message && (
            <div className={`absolute top-full mt-2 left-0 right-0 text-xs px-2 py-1 rounded ${
              message.includes('Check your email') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </form>
      )}
    </div>
  )
} 