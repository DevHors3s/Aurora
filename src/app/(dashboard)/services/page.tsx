import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ServicesClient } from '@/components/dashboard/services/ServicesClient'
import type { Service } from '@/types'

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('id').eq('owner_id', user.id).maybeSingle()

  let services: Service[] = []
  if (business?.id) {
    const { data } = await supabase
      .from('services').select('*').eq('business_id', business.id).order('created_at')
    services = (data as Service[]) ?? []
  }

  return (
    <div className="p-6 lg:p-10">
      <ServicesClient services={services} businessId={business?.id ?? ''} />
    </div>
  )
}
