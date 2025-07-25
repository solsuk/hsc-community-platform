import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client-side Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side Supabase client for API routes and server components
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Admin client for server-side operations that need elevated permissions
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Database types (we'll expand this as we create tables)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          email_verified_at: string | null
          community_verified: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          email_verified_at?: string | null
          community_verified?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          email_verified_at?: string | null
          community_verified?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      auth_tokens: {
        Row: {
          id: string
          token: string
          user_id: string
          token_type: 'magic_link' | 'qr_code'
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          user_id: string
          token_type: 'magic_link' | 'qr_code'
          expires_at: string
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          user_id?: string
          token_type?: 'magic_link' | 'qr_code'
          expires_at?: string
          used_at?: string | null
          created_at?: string
        }
      }
      listings: {
        Row: {
          id: string
          user_id: string
          type: 'sell' | 'trade' | 'announce' | 'advertise'
          category: string | null
          title: string
          price: number | null
          basic_description: string | null
          detailed_description: string | null
          legacy_description: string | null
          image_urls: string[] | null
          video_urls: string[] | null
          featured_image_url: string | null
          status: 'active' | 'sold' | 'expired' | 'draft'
          is_private: boolean
          clicks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'sell' | 'trade' | 'announce' | 'advertise'
          category?: string | null
          title: string
          price?: number | null
          basic_description?: string | null
          detailed_description?: string | null
          legacy_description?: string | null
          image_urls?: string[] | null
          video_urls?: string[] | null
          featured_image_url?: string | null
          status?: 'active' | 'sold' | 'expired' | 'draft'
          is_private?: boolean
          clicks?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'sell' | 'trade' | 'announce' | 'advertise'
          category?: string | null
          title?: string
          price?: number | null
          basic_description?: string | null
          detailed_description?: string | null
          legacy_description?: string | null
          image_urls?: string[] | null
          video_urls?: string[] | null
          featured_image_url?: string | null
          status?: 'active' | 'sold' | 'expired' | 'draft'
          is_private?: boolean
          clicks?: number
          created_at?: string
          updated_at?: string
        }
      }
      listing_categories: {
        Row: {
          id: number
          name: string
          display_name: string
          applies_to: string[]
          sort_order: number
        }
        Insert: {
          id?: number
          name: string
          display_name: string
          applies_to?: string[]
          sort_order?: number
        }
        Update: {
          id?: number
          name?: string
          display_name?: string
          applies_to?: string[]
          sort_order?: number
        }
      }
      qr_codes: {
        Row: {
          id: string
          code: string
          user_id: string
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          user_id: string
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          user_id?: string
          last_used_at?: string | null
          created_at?: string
        }
      }
    }
  }
} 