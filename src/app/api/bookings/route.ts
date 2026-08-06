import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAvailableSlots } from '@/lib/availability'
import { zonedTimeToUtc } from '@/lib/tz'
import { scheduleReminders } from '@/lib/reminders'
import { sendWhatsApp, tplConfirmation, tplDepositPending } from '@/lib/whatsapp'
import { isBusinessActive, limitsForPlan } from '@/lib/plans'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { BookingFormData } from '@/types'

export async function POST(req: Request) {
  const body = (await req.json()) as BookingFormData & { business_id: string }
  const { business_id, service_id, staff_id, date, time, client_name, client_phone, deposit_ref } = body

  if (
    !business_id || !service_id || !staff_id || !date || !time ||
    !client_name?.trim() || !client_phone?.trim()
  ) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  // Cliente admin: el visitante es anonimo y, tras el fix de RLS, el anon key
  // ya no tiene permiso de insertar en `appointments`/`reminders`. Como contrapartida,
  // esta ruta valida a mano todo lo que antes garantizaba (implicitamente) RLS.
  const supabase = createAdminClient()

  const [serviceRes, staffRes, businessRes, linkRes] = await Promise.all([
    supabase.from('services').select('*').eq('id', service_id).eq('business_id', business_id).eq('is_active', true).maybeSingle(),
    supabase.from('staff').select('*').eq('id', staff_id).eq('business_id', business_id).eq('is_active', true).maybeSingle(),
    supabase.from('businesses').select('*').eq('id', business_id).eq('is_active', true).maybeSingle(),
    supabase.from('staff_services').select('staff_id').eq('staff_id', staff_id).eq('service_id', service_id).maybeSingle(),
  ])

  const service = serviceRes.data
  const staff = staffRes.data
  const business = businessRes.data

  if (!business) return NextResponse.json({ error: 'Negocio no encontrado o inactivo' }, { status: 404 })
  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  if (!staff) return NextResponse.json({ error: 'Profesional no encontrado' }, { status: 404 })
  if (!linkRes.data) return NextResponse.json({ error: 'Ese profesional no ofrece este servicio' }, { status: 400 })

  if (!isBusinessActive({
    plan: business.plan,
    trial_ends_at: business.trial_ends_at,
    subscription_status: business.subscription_status,
  })) {
    return NextResponse.json(
      { error: 'Este negocio no esta aceptando reservas en este momento. Contactalo directamente.' },
      { status: 403 },
    )
  }

  const { maxAppointmentsPerMonth } = limitsForPlan(business.plan)
  if (maxAppointmentsPerMonth != null) {
    const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
    const { count } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business_id)
      .neq('status', 'cancelled')
      .gte('starts_at', monthStart.toISOString())
    if (count != null && count >= maxAppointmentsPerMonth) {
      return NextResponse.json(
        { error: 'Este negocio alcanzo su limite de citas del mes. Contactalo directamente.' },
        { status: 403 },
      )
    }
  }

  const requiresDeposit = !!business.deposit_enabled
  if (requiresDeposit && !deposit_ref?.trim()) {
    return NextResponse.json({ error: 'Falta el codigo de operacion del adelanto' }, { status: 400 })
  }

  const timeZone = (business.timezone as string) ?? 'America/Lima'

  // Revalida que el slot pedido siga libre. Es defensa en profundidad: la garantia
  // real contra doble reserva es el exclusion constraint de la migracion 002 —
  // esto solo evita gastar una escritura y da un mensaje mas claro en el caso comun.
  const freshSlots = await getAvailableSlots({
    staff_id,
    service_duration_min: service.duration_min as number,
    date,
    timeZone,
  })
  if (!freshSlots.includes(time)) {
    return NextResponse.json({ error: 'Ese horario ya no esta disponible, elige otro' }, { status: 409 })
  }

  const starts = zonedTimeToUtc(date, time, timeZone)
  const ends = new Date(starts.getTime() + (service.duration_min as number) * 60_000)

  const { data: appt, error } = await supabase
    .from('appointments')
    .insert({
      business_id, service_id, staff_id,
      client_name: client_name.trim(),
      client_phone: client_phone.trim(),
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      // Con adelanto: la cita queda "pending" hasta que el dueño verifica el
      // Yape con 1 clic en el dashboard (ver /api/appointments/[id]).
      status: requiresDeposit ? 'pending' : 'confirmed',
      deposit_status: requiresDeposit ? 'pending' : 'not_required',
      deposit_ref: requiresDeposit ? deposit_ref!.trim() : null,
    })
    .select()
    .single()

  if (error || !appt) {
    // 23P01 = violacion del exclusion constraint (dos reservas al mismo tiempo)
    if (error?.code === '23P01') {
      return NextResponse.json({ error: 'Ese horario acaba de ser tomado, elige otro' }, { status: 409 })
    }
    return NextResponse.json({ error: error?.message ?? 'Error al crear la cita' }, { status: 500 })
  }

  const niceDateEs = format(starts, "EEEE d 'de' MMMM", { locale: es })
  const niceTime   = format(starts, 'HH:mm')

  const tplVars = {
    client_name,
    business_name:    (business.name   as string) ?? '',
    business_address: (business.address as string | null) ?? null,
    service_name: service.name as string,
    staff_name:   staff.name  as string ?? '',
    date: niceDateEs,
    time: niceTime,
  }

  // Fire-and-forget: no bloquea la respuesta.
  // Con adelanto pendiente, no programamos el recordatorio de 24h todavia
  // (seria raro recordar una cita que ni el dueño confirmo) — eso pasa cuando
  // se verifica el pago, ver /api/appointments/[id].
  const tasks: Promise<unknown>[] = [
    sendWhatsApp(
      client_phone,
      requiresDeposit ? tplDepositPending(tplVars) : tplConfirmation(tplVars),
    ).catch(console.error),
  ]
  if (!requiresDeposit) {
    tasks.push(scheduleReminders(appt.id as string, appt.starts_at as string).catch(console.error))
  }
  Promise.all(tasks)

  return NextResponse.json({ appointment: appt })
}
