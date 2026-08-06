import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente con la service role key: ignora RLS por completo.
// SOLO para uso en el servidor (route handlers, cron, lib/*) y NUNCA
// desde un componente 'use client' — la key nunca debe llegar al browser.
//
// Se usa para las escrituras que un visitante anonimo necesita hacer
// (crear una cita, programar recordatorios) sin abrir policies publicas
// de INSERT en la base de datos.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no esta configurada. Requerida para operaciones de servidor ' +
      '(booking publico, cron de recordatorios) que deben saltarse RLS.',
    )
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
