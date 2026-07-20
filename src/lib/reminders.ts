import { createClient } from '@/lib/supabase/server'
import type { ReminderType } from '@/types'

/**
 * Inserta los 3 recordatorios para una cita: confirmacion inmediata, 24h y 1h antes.
 * El envio real lo hace un Vercel Cron Job que lee la tabla 'reminders'.
 */
export async function scheduleReminders(
  appointmentId: string,
  startsAt: string,
) {
  const supabase = await createClient()
  const start = new Date(startsAt)
  const items: Array<{ type: ReminderType; scheduled_at: string }> = [
    { type: 'confirmation', scheduled_at: new Date().toISOString() },
    {
      type: 'reminder_24h',
      scheduled_at: new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'reminder_1h',
      scheduled_at: new Date(start.getTime() - 60 * 60 * 1000).toISOString(),
    },
  ]
  return supabase
    .from('reminders')
    .insert(items.map((i) => ({ ...i, appointment_id: appointmentId })))
}
