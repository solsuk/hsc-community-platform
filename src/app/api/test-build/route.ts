import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Build test successful',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasGrokKey: !!process.env.XAI_API_KEY,
    }
  })
} 