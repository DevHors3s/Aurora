'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Staff } from '@/types'

export function useStaff(businessId: string | null) {
  const [data, setData] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) return
    const supabase = createClient()
    supabase
      .from('staff')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .then(({ data }) => {
        setData((data as Staff[]) ?? [])
        setLoading(false)
      })
  }, [businessId])

  return { data, loading }
}
