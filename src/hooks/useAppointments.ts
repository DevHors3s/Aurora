'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment } from '@/types'

export function useAppointments(businessId: string | null) {
  const [data, setData] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) return
    const supabase = createClient()
    supabase
      .from('appointments')
      .select('*, staff(*), service:services(*)')
      .eq('business_id', businessId)
      .order('starts_at', { ascending: true })
      .then(({ data }) => {
        setData((data as Appointment[]) ?? [])
        setLoading(false)
      })
  }, [businessId])

  return { data, loading }
}
