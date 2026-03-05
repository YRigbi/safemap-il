import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Client-side (browser)
export const createSupabaseClient = () =>
  createClientComponentClient<Database>()

// Server-side (Server Components / Route Handlers)
export const createSupabaseServer = () =>
  createServerComponentClient<Database>({ cookies })

// Admin (service role — server only, never expose to client)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
