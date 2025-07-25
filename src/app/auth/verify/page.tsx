'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function VerifyContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState<string>('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error')
        setError('No verification token provided')
        return
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          // Redirect to home page after successful verification
          setTimeout(() => {
            router.push('/?auth=success')
          }, 2000)
        } else {
          setStatus('error')
          setError(data.error || 'Verification failed')
        }
      } catch (err) {
        setStatus('error')
        setError('Network error occurred')
      }
    }

    verifyToken()
  }, [token, router])

  return (
    <div className="min-h-screen bg-[#EAE8E4] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[25px_25px_25px_5px] shadow-lg max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-2">Verifying Your Access</h1>
            <p className="text-gray-600">Please wait while we verify your magic link...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 mb-4">
              <svg className="w-20 h-20 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-3 text-green-600">🎉 Successfully Logged In!</h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium mb-2">
                Welcome to Hillsmere Shores Classifieds!
              </p>
              <p className="text-green-700 text-sm">
                You're now authenticated and can access all community features. Look for your email address in the top-right corner to confirm you're logged in.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Redirecting you to the community board...</span>
            </div>
            <div className="text-sm text-gray-500">
              If you're not redirected automatically, <a href="/?auth=success" className="text-blue-600 hover:underline font-medium">click here</a>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                This could happen if:
              </p>
              <ul className="text-sm text-gray-500 text-left list-disc list-inside space-y-1">
                <li>The magic link has expired (24 hours)</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
              <div className="mt-4 pt-4 border-t">
                <a 
                  href="/" 
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Return to HSC
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#EAE8E4] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[25px_25px_25px_5px] shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
} 