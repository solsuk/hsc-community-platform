import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('hsc-session')

    if (!sessionCookie) {
      return NextResponse.json({ user: null, authenticated: false })
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value)
      
      // Check if session is still valid (1 hour)
      const loginTime = new Date(sessionData.loginTime)
      const now = new Date()
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLogin > 1) {
        // Session expired, clear cookie
        cookieStore.delete('hsc-session')
        return NextResponse.json({ user: null, authenticated: false })
      }

      return NextResponse.json({
        user: {
          id: sessionData.userId,
          email: sessionData.email,
          communityVerified: sessionData.communityVerified,
          isAdmin: sessionData.isAdmin,
          loginTime: sessionData.loginTime
        },
        authenticated: true
      })

    } catch (parseError) {
      // Invalid session data, clear cookie
      cookieStore.delete('hsc-session')
      return NextResponse.json({ user: null, authenticated: false })
    }

  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ error: 'Session check failed' }, { status: 500 })
  }
} 