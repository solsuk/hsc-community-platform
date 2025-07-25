import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'Token parameter required' }, { status: 400 })
    }
    
    const supabase = createAdminSupabaseClient()
    
    // Check if token exists
    const { data: tokenData, error } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .single()
    
    if (error) {
      return NextResponse.json({
        found: false,
        error: error.message,
        token: token
      })
    }
    
    // Check all tokens for this user
    const { data: allUserTokens } = await supabase
      .from('auth_tokens')
      .select('*')
      .eq('user_id', tokenData.user_id)
      .order('created_at', { ascending: false })
    
    return NextResponse.json({
      found: true,
      tokenData,
      allUserTokens,
      currentTime: new Date().toISOString(),
      isExpired: new Date(tokenData.expires_at) < new Date()
    })
    
  } catch (error) {
    console.error('Debug token error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 