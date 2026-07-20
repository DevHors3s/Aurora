import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WeekCalendar } from '@/components/dashboard/WeekCalendar'
import type { Appointment } from '@/types'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).maybeSingle()

  let appointments: Appointment[] = []
  if (business?.id) {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30)
    const { data } = await supabase
      .from('appointments')
      .select('*, staff(*), service:services(*)')
      .eq('business_id', business.id)
      .gte('starts_at', from.toISOString())
      .lte('starts_at', to.toISOString())
      .neq('status', 'cancelled')
    appointments = (data as Appointment[]) ?? []
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground text-sm mt-1">Vista semanal de todas las citas</p>
      </div>
      <WeekCalendar appointments={appointments} />
    </div>
  )
}
