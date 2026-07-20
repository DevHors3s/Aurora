import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AppointmentStatus } from '@/types'

const VALID_STATUSES: AppointmentStatus[] = [
  'pending', 'confirmed', 'completed', 'cancelled', 'no_show',
]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()
  const { status } = body as { status: AppointmentStatus }

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: appt, error: fetchError } = await supabase
    .from('appointments')
    .select('id, business_id')
    .eq('id', id)
    .single()

  if (fetchError || !appt) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', appt.business_id)
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointment: data })
}
