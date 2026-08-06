import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelReminders, scheduleReminders } from '@/lib/reminders'
import { sendWhatsApp, tplConfirmation } from '@/lib/whatsapp'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AppointmentStatus, DepositStatus } from '@/types'

const VALID_STATUSES: AppointmentStatus[] = [
  'pending', 'confirmed', 'completed', 'cancelled', 'no_show',
]
const VALID_DEPOSIT_STATUSES: DepositStatus[] = [
  'not_required', 'pending', 'verified', 'rejected',
]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()
  const { status, deposit_status } = body as {
    status?: AppointmentStatus
    deposit_status?: DepositStatus
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
  }
  if (deposit_status && !VALID_DEPOSIT_STATUSES.includes(deposit_status)) {
    return NextResponse.json({ error: 'Estado de deposito invalido' }, { status: 400 })
  }
  if (!status && !deposit_status) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: appt, error: fetchError } = await supabase
    .from('appointments')
    .select('*, business:businesses(id, owner_id, name, address), service:services(name), staff(name)')
    .eq('id', id)
    .single()

  if (fetchError || !appt) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  const business = appt.business as { id: string; owner_id: string; name: string; address: string | null } | null
  if (!business || business.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const patch: Record<string, AppointmentStatus | DepositStatus> = {}
  if (status) patch.status = status
  if (deposit_status) patch.deposit_status = deposit_status

  const { data, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'cancelled') {
    await cancelReminders(id).catch(console.error)
  }

  // El dueño acaba de verificar el adelanto: recien ahora la cita esta
  // realmente confirmada, asi que recien ahora se avisa y se programa el
  // recordatorio de 24h (antes solo se habia avisado "recibimos tu reserva").
  if (status === 'confirmed' && deposit_status === 'verified') {
    const service = appt.service as { name: string } | null
    const staff = appt.staff as { name: string } | null
    const starts = new Date(appt.starts_at as string)
    const tplVars = {
      client_name: appt.client_name as string,
      business_name: business.name,
      business_address: business.address,
      service_name: service?.name ?? '',
      staff_name: staff?.name ?? '',
      date: format(starts, "EEEE d 'de' MMMM", { locale: es }),
      time: format(starts, 'HH:mm'),
    }
    await Promise.all([
      sendWhatsApp(appt.client_phone as string, tplConfirmation(tplVars)).catch(console.error),
      scheduleReminders(id, appt.starts_at as string).catch(console.error),
    ])
  }

  return NextResponse.json({ appointment: data })
}
