import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { AppointmentCard } from '@/components/dashboard/AppointmentCard'
import { TomorrowReminders, type TomorrowReminderRow } from '@/components/dashboard/TomorrowReminders'
import { todayInZone, zonedTimeToUtc } from '@/lib/tz'
import { CalendarX2, Smartphone } from 'lucide-react'
import type { Appointment } from '@/types'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre',
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos dias'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, timezone')
    .eq('owner_id', user!.id)
    .single()

  const { count: pendingDeposits } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', business!.id)
    .eq('deposit_status', 'pending')

  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  const { data: rawAppts } = await supabase
    .from('appointments')
    .select('*, staff(*), service:services(*)')
    .eq('business_id', business!.id)
    .gte('starts_at', dayStart.toISOString())
    .lt('starts_at', dayEnd.toISOString())
    .order('starts_at', { ascending: true })

  const appts = (rawAppts ?? []) as Appointment[]

  // Widget de recordatorios de mañana: reusa los recordatorios que ya
  // programa /api/bookings (tabla `reminders`), solo filtra los de mañana.
  const timeZone = (business!.timezone as string) ?? 'America/Lima'
  const todayStr = todayInZone(timeZone)
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const tomorrowStr = new Date(Date.UTC(ty, tm - 1, td + 1)).toISOString().slice(0, 10)
  const tomorrowStart = zonedTimeToUtc(tomorrowStr, '00:00', timeZone).getTime()
  const tomorrowEnd = zonedTimeToUtc(tomorrowStr, '23:59', timeZone).getTime()

  const { data: rawReminders } = await supabase
    .from('reminders')
    .select('id, appointment:appointments(client_name, client_phone, starts_at, status, service:services(name), staff(name))')
    .eq('type', 'reminder_24h')
    .eq('status', 'pending')

  const tomorrowReminders: TomorrowReminderRow[] = (rawReminders ?? [])
    .map((r) => {
      const appt = r.appointment as unknown as {
        client_name: string; client_phone: string; starts_at: string; status: string
        service: { name: string } | null; staff: { name: string } | null
      } | null
      if (!appt || appt.status !== 'confirmed') return null
      const startsAtMs = new Date(appt.starts_at).getTime()
      if (startsAtMs < tomorrowStart || startsAtMs > tomorrowEnd) return null
      return {
        reminderId: r.id as string,
        clientName: appt.client_name,
        clientPhone: appt.client_phone,
        startsAt: appt.starts_at,
        serviceName: appt.service?.name ?? '',
        staffName: appt.staff?.name ?? '',
      }
    })
    .filter((x): x is TomorrowReminderRow => x !== null)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  const stats = {
    total: appts.length,
    pending: appts.filter((a) => a.status === 'pending').length,
    completed: appts.filter((a) => a.status === 'completed').length,
    revenue: appts
      .filter((a) => a.status !== 'cancelled' && a.status !== 'no_show')
      .reduce((sum, a) => sum + (a.service?.price ?? 0), 0),
  }

  const niceDate = `${DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`
  const ownerName = (user!.user_metadata?.full_name as string) || business!.name

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <header>
        <p className="text-sm text-muted-foreground capitalize">{niceDate}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {greeting()}, {ownerName}
        </h1>
      </header>

      {!!pendingDeposits && pendingDeposits > 0 && (
        <Link
          href="/appointments"
          className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-300 transition hover:bg-amber-500/15"
        >
          <Smartphone className="size-4 shrink-0" />
          Tienes {pendingDeposits} {pendingDeposits === 1 ? 'reserva esperando' : 'reservas esperando'} que confirmes su adelanto por Yape.
        </Link>
      )}

      <StatsCards stats={stats} />

      <TomorrowReminders rows={tomorrowReminders} businessName={business!.name as string} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Citas de hoy</h2>
          <span className="text-sm text-muted-foreground">
            {appts.length} cita{appts.length === 1 ? '' : 's'}
          </span>
        </div>

        {appts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <div className="mx-auto grid place-items-center size-12 rounded-full bg-muted text-muted-foreground">
              <CalendarX2 className="size-5" />
            </div>
            <p className="mt-4 font-medium">Sin citas hoy</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Comparte tu link de reservas con tus clientes para que reserven.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {appts.map((a) => (
              <AppointmentCard key={a.id} appt={a} businessName={business!.name as string} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
