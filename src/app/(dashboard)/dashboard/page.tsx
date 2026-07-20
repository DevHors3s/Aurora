import { createClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { AppointmentCard } from '@/components/dashboard/AppointmentCard'
import { CalendarX2 } from 'lucide-react'
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
    .select('id, name')
    .eq('owner_id', user!.id)
    .single()

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

      <StatsCards stats={stats} />

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
              <AppointmentCard key={a.id} appt={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
