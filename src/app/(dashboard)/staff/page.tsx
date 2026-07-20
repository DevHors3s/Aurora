import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffClient } from '@/components/dashboard/staff/StaffClient'
import type { Staff, Service } from '@/types'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).maybeSingle()

  let staff: Staff[] = []
  let services: Service[] = []
  if (business?.id) {
    const [staffRes, servicesRes] = await Promise.all([
      supabase.from('staff').select('*').eq('business_id', business.id).order('created_at'),
      supabase.from('services').select('*').eq('business_id', business.id).eq('is_active', true),
    ])
    staff = (staffRes.data as Staff[]) ?? []
    services = (servicesRes.data as Service[]) ?? []
  }

  return (
    <div className="p-6 lg:p-10">
      <StaffClient staff={staff} services={services} businessId={business?.id ?? ''} />
    </div>
  )
}
