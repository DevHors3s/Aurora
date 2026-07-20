import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/dashboard/settings/SettingsClient'
import type { Business } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses').select('*').eq('owner_id', user.id).maybeSingle()
  if (!business) redirect('/onboarding')

  return (
    <div className="p-6 lg:p-10">
      <SettingsClient
        business={business as Business}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}
      />
    </div>
  )
}
