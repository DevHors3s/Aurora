import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { RealtimeNotifier } from '@/components/dashboard/RealtimeNotifier'
import { TrialBanner } from '@/components/dashboard/TrialBanner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, plan, trial_ends_at, subscription_status')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) redirect('/onboarding')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar businessName={business.name as string} userEmail={user.email ?? ''} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TrialBanner business={business} />
        <main className="flex-1 min-w-0 pt-14 md:pt-0">{children}</main>
      </div>
      <RealtimeNotifier businessId={business.id as string} />
    </div>
  )
}
