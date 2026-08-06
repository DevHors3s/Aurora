import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Nota: NO se parametriza con <Database> (ver ./types.ts) porque nuestro tipo
// escrito a mano no tiene la forma exacta que supabase-js espera (le falta
// Relationships/Views/Functions/Enums por tabla) y con eso cada query colapsa
// a `never`. Cuando exista un proyecto Supabase vinculado, generar los tipos
// reales con `supabase gen types` y recien ahi parametrizar estos clientes.
export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // ignored in Server Components
        }
      },
    },
  })
}
