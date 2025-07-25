import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient()
    
    // Check if this is a development environment
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Setup only available in development' }, { status: 403 })
    }

    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log(`Setting up admin access for: ${email}`)

    // Update user to be admin
    const { data, error } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('email', email)
      .select('id, email, is_admin')
      .single()

    if (error) {
      console.error('Admin setup error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Admin setup successful:', data)

    return NextResponse.json({ 
      success: true, 
      message: `Admin access granted to ${email}`,
      user: data
    })

  } catch (error) {
    console.error('Admin setup failed:', error)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}

// GET endpoint to check current admin status
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient()
    
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, is_admin, created_at')
      .eq('email', email)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })

  } catch (error) {
    console.error('Admin check failed:', error)
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
} 