import { createBrowserClient } from '@supabase/ssr'

// Ver la nota en ./server.ts sobre por que esto no se parametriza con <Database>.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  return createBrowserClient(url, key)
}
