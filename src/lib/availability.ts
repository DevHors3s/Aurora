import { createClient } from '@/lib/supabase/server'

interface GetAvailableSlotsParams {
  staff_id: string
  service_duration_min: number
  date: string // YYYY-MM-DD
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Devuelve los horarios disponibles ['09:00','09:30',...] para un staff/dia/servicio.
 * Reglas:
 *  - Slot ocupado si: starts_at < slot_end AND ends_at > slot_start
 *  - Si la fecha es hoy, filtra slots ya pasados
 *  - Slots cada [service_duration_min] minutos dentro del horario del barbero
 */
export async function getAvailableSlots({
  staff_id,
  service_duration_min,
  date,
}: GetAvailableSlotsParams): Promise<string[]> {
  const supabase = await createClient()

  const target = new Date(`${date}T00:00:00`)
  const dayOfWeek = target.getDay() // 0=Dom .. 6=Sab

  const { data: schedules } = await supabase
    .from('schedules')
    .select('start_time, end_time')
    .eq('staff_id', staff_id)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  if (!schedules || schedules.length === 0) return []

  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59`)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('starts_at, ends_at, status')
    .eq('staff_id', staff_id)
    .gte('starts_at', dayStart.toISOString())
    .lte('starts_at', dayEnd.toISOString())
    .neq('status', 'cancelled')

  const busy = (appointments ?? []).map((a) => ({
    start: new Date(a.starts_at).getTime(),
    end: new Date(a.ends_at).getTime(),
  }))

  const now = Date.now()
  const isToday = new Date().toISOString().slice(0, 10) === date

  const slots: string[] = []
  for (const block of schedules) {
    const startMin = toMinutes(block.start_time as string)
    const endMin = toMinutes(block.end_time as string)
    for (
      let m = startMin;
      m + service_duration_min <= endMin;
      m += service_duration_min
    ) {
      const slotStart = new Date(`${date}T${toHHMM(m)}:00`).getTime()
      const slotEnd = slotStart + service_duration_min * 60_000
      if (isToday && slotStart <= now) continue
      const collides = busy.some((b) => b.start < slotEnd && b.end > slotStart)
      if (!collides) slots.push(toHHMM(m))
    }
  }
  return slots
}
