import { createAdminClient } from '@/lib/supabase/admin'
import type { ReminderType } from '@/types'

/**
 * Inserta los recordatorios para una cita: confirmacion inmediata y 24h antes.
 * El envio real lo hace un Vercel Cron Job que lee la tabla 'reminders'.
 *
 * Usa el cliente admin porque quien llama esto es la ruta publica de booking
 * (visitante anonimo) y `reminders` no tiene policy de INSERT para anon.
 */
export async function scheduleReminders(
  appointmentId: string,
  startsAt: string,
) {
  const supabase = createAdminClient()
  const start = new Date(startsAt)
  const now = Date.now()

  const items: Array<{ type: ReminderType; scheduled_at: string }> = [
    { type: 'confirmation', scheduled_at: new Date().toISOString() },
    {
      type: 'reminder_24h',
      scheduled_at: new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  // No programar recordatorios cuya hora ya paso (reservas hechas con <24h de anticipacion)
  const pending = items.filter((i) => new Date(i.scheduled_at).getTime() > now)

  return supabase
    .from('reminders')
    .insert(pending.map((i) => ({ ...i, appointment_id: appointmentId })))
}

/** Borra los recordatorios pendientes de una cita cancelada, para no avisar de algo que no va. */
export async function cancelReminders(appointmentId: string) {
  const supabase = createAdminClient()
  return supabase
    .from('reminders')
    .delete()
    .eq('appointment_id', appointmentId)
    .eq('status', 'pending')
}
