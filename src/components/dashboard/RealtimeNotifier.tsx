'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'

export function RealtimeNotifier({ businessId }: { businessId: string }) {
  const router = useRouter()

  useEffect(() => {
    if (!businessId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`business-${businessId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments', filter: `business_id=eq.${businessId}` },
        (payload) => {
          const appt = payload.new as { client_name: string }
          toast(`Nueva reserva de ${appt.client_name}`, {
            icon: <Bell className="size-4 text-primary" />,
            description: 'Revisa tu agenda para ver los detalles.',
            action: { label: 'Ver', onClick: () => router.push('/appointments') },
          })
          router.refresh()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [businessId, router])

  return null
}
