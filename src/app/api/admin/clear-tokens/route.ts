import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient()
    
    // Delete all auth tokens
    const { error } = await supabase
      .from('auth_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
    
    if (error) {
      console.error('Error clearing tokens:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    console.log('All auth tokens cleared successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'All auth tokens cleared successfully' 
    })
    
  } catch (error) {
    console.error('Clear tokens error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 