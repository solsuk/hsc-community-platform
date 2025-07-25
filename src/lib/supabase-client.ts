import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Client-side only Supabase client for components
export const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) 