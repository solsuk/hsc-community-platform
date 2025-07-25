import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Delete all records from the tables
    const { error: usersError } = await supabase.from('users').delete();
    const { error: tokensError } = await supabase.from('auth_tokens').delete();
    const { error: listingsError } = await supabase.from('listings').delete();
    const { error: qrCodesError } = await supabase.from('qr_codes').delete();
    
    if (usersError || tokensError || listingsError || qrCodesError) {
      console.error('Error clearing database:', { usersError, tokensError, listingsError, qrCodesError });
      return NextResponse.json({ error: 'Failed to clear database' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Clear database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 