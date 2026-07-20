import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scheduleReminders } from '@/lib/reminders'
import { sendWhatsApp, tplConfirmation } from '@/lib/whatsapp'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { BookingFormData } from '@/types'

export async function POST(req: Request) {
  const body = (await req.json()) as BookingFormData & { business_id: string }
  const { business_id, service_id, staff_id, date, time, client_name, client_phone } = body

  if (!business_id || !service_id || !staff_id || !date || !time || !client_name || !client_phone) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const supabase = await createClient()
  const [serviceRes, staffRes, businessRes] = await Promise.all([
    supabase.from('services').select('*').eq('id', service_id).single(),
    supabase.from('staff').select('*').eq('id', staff_id).single(),
    supabase.from('businesses').select('*').eq('id', business_id).single(),
  ])

  const service = serviceRes.data
  const staff   = staffRes.data
  const business = businessRes.data

  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })

  const starts = new Date(`${date}T${time}:00`)
  const ends   = new Date(starts.getTime() + (service.duration_min as number) * 60_000)

  const { data: appt, error } = await supabase
    .from('appointments')
    .insert({
      business_id, service_id, staff_id,
      client_name, client_phone,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      status: 'confirmed',
    })
    .select()
    .single()

  if (error || !appt) {
    return NextResponse.json({ error: error?.message ?? 'Error al crear la cita' }, { status: 500 })
  }

  const niceDateEs = format(starts, "EEEE d 'de' MMMM", { locale: es })
  const niceTime   = format(starts, 'HH:mm')

  const tplVars = {
    client_name,
    business_name:    (business?.name   as string) ?? '',
    business_address: (business?.address as string | null) ?? null,
    service_name: service.name as string,
    staff_name:   staff?.name  as string ?? '',
    date: niceDateEs,
    time: niceTime,
  }

  // Fire-and-forget: no bloquea la respuesta
  Promise.all([
    sendWhatsApp(client_phone, tplConfirmation(tplVars)).catch(console.error),
    scheduleReminders(appt.id as string, appt.starts_at as string).catch(console.error),
  ])

  return NextResponse.json({ appointment: appt })
}
