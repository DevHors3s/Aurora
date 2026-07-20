import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppointmentsClient } from '@/components/dashboard/appointments/AppointmentsClient'
import type { Appointment } from '@/types'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).maybeSingle()

  let appointments: Appointment[] = []
  if (business?.id) {
    const { data } = await supabase
      .from('appointments')
      .select('*, staff(*), service:services(*)')
      .eq('business_id', business.id)
      .order('starts_at', { ascending: false })
    appointments = (data as Appointment[]) ?? []
  }

  return (
    <div className="p-6 lg:p-10">
      <AppointmentsClient appointments={appointments} businessId={business?.id ?? ''} />
    </div>
  )
}
