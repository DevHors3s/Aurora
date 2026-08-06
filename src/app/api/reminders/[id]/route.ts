import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Marca un recordatorio como enviado. Lo llama el dashboard cuando el dueño
// hace clic en "Enviar" del widget de recordatorios (link wa.me asistido) —
// no envia nada por si mismo, solo registra que ya se mando a mano.
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // La policy "Owners view reminders" ya solo deja ver los recordatorios de
  // citas de negocios del usuario — si esto no encuentra nada, o no existe o
  // no es suyo.
  const { data: reminder } = await supabase
    .from('reminders')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (!reminder) {
    return NextResponse.json({ error: 'Recordatorio no encontrado' }, { status: 404 })
  }

  // No hay policy de UPDATE para el dueño sobre `reminders` (solo SELECT), asi
  // que el update en si va con el cliente admin, una vez ya verificada arriba
  // la pertenencia con el cliente autenticado.
  const admin = createAdminClient()
  const { error } = await admin
    .from('reminders')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
