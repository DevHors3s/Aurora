'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/types'

export function useServices(businessId: string | null) {
  const [data, setData] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) return
    const supabase = createClient()
    supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .then(({ data }) => {
        setData((data as Service[]) ?? [])
        setLoading(false)
      })
  }, [businessId])

  return { data, loading }
}
