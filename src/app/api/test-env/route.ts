import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const grokKey = process.env.XAI_API_KEY;
  
  // Test Supabase connection
  let supabaseStatus = 'unknown';
  let supabaseError = null;
  let tablesExist = false;
  let authTokensTableExists = false;
  let authTokensError = null;
  
  try {
    const supabase = createAdminSupabaseClient();
    
    // Test basic connection with users table
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
      
    if (error) {
      supabaseStatus = 'error';
      supabaseError = error.message;
    } else {
      supabaseStatus = 'connected';
      tablesExist = true;
    }
    
    // Test auth_tokens table specifically
    const { data: tokenData, error: tokenError } = await supabase
      .from('auth_tokens')
      .select('count', { count: 'exact', head: true });
      
    if (tokenError) {
      authTokensError = tokenError.message;
    } else {
      authTokensTableExists = true;
    }
    
  } catch (error) {
    supabaseStatus = 'connection_failed';
    supabaseError = error instanceof Error ? error.message : 'Unknown error';
  }
  
  return NextResponse.json({
    hasGrokKey: !!grokKey,
    keyLength: grokKey?.length || 0,
    keyStart: grokKey?.substring(0, 10) || 'not found',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('XAI') || key.includes('GROK')),
    supabase: {
      status: supabaseStatus,
      error: supabaseError,
      tablesExist,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      authTokensTable: {
        exists: authTokensTableExists,
        error: authTokensError
      }
    }
  });
} 