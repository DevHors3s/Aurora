import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, tplReminder24h } from '@/lib/whatsapp'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Llamado por Vercel Cron cada 30 minutos
// vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "*/30 * * * *" }] }
export async function GET(req: Request) {
  // Verificar token de seguridad
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cliente admin: un cron no tiene sesion de usuario, y `reminders` solo
  // tiene policy de SELECT para el dueño autenticado. Sin esto el cron
  // siempre veia 0 filas y reportaba {sent: 0} en silencio.
  const supabase = createAdminClient()
  const now = new Date()
  const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000)

  // Buscar reminders pendientes cuyo scheduled_at ya pasó (con margen de 5 min)
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select(`
      *,
      appointment:appointments(
        client_name, client_phone, starts_at, ends_at,
        service:services(name),
        staff(name),
        business:businesses(name, address)
      )
    `)
    .eq('status', 'pending')
    .lte('scheduled_at', fiveMinutesLater.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!reminders || reminders.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0
  let failed = 0

  for (const reminder of reminders) {
    const appt = reminder.appointment as Record<string, unknown>
    if (!appt) continue

    const starts = new Date(appt.starts_at as string)
    const service = appt.service as { name: string } | null
    const staff   = appt.staff   as { name: string } | null
    const business = appt.business as { name: string; address?: string } | null

    const tplVars = {
      client_name:      appt.client_name as string,
      business_name:    business?.name ?? '',
      business_address: business?.address ?? null,
      service_name:     service?.name ?? '',
      staff_name:       staff?.name ?? '',
      date: format(starts, "EEEE d 'de' MMMM", { locale: es }),
      time: format(starts, 'HH:mm'),
    }

    const message =
      reminder.type === 'reminder_24h' ? tplReminder24h(tplVars) : null

    if (!message) {
      // 'confirmation' ya se envía en el momento del booking — marcar como sent
      await supabase.from('reminders').update({ status: 'sent', sent_at: now.toISOString() }).eq('id', reminder.id)
      sent++
      continue
    }

    try {
      await sendWhatsApp(appt.client_phone as string, message)
      await supabase.from('reminders').update({ status: 'sent', sent_at: now.toISOString() }).eq('id', reminder.id)
      sent++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await supabase.from('reminders').update({ status: 'failed', error_message: msg }).eq('id', reminder.id)
      failed++
      console.error('[cron/reminders] failed:', reminder.id, msg)
    }
  }

  return NextResponse.json({ sent, failed, total: reminders.length })
}
