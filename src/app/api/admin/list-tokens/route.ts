import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient()
    
    // Get all tokens
    const { data: allTokens, error } = await supabase
      .from('auth_tokens')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }
    
    return NextResponse.json({
      success: true,
      totalTokens: allTokens?.length || 0,
      tokens: allTokens?.map(token => ({
        id: token.id,
        token_type: token.token_type,
        expires_at: token.expires_at,
        used_at: token.used_at,
        created_at: token.created_at,
        isExpired: new Date(token.expires_at) < new Date(),
        token: token.token.substring(0, 8) + '...' // Show first 8 chars for identification
      })) || []
    })
    
  } catch (error) {
    console.error('List tokens error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 