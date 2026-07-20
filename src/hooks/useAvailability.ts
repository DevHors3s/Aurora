'use client'
import { useEffect, useState } from 'react'

export function useAvailability(
  staffId: string | null,
  serviceId: string | null,
  date: string | null,
) {
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!staffId || !serviceId || !date) return
    setLoading(true)
    fetch(
      `/api/availability?staff_id=${staffId}&service_id=${serviceId}&date=${date}`,
    )
      .then((r) => r.json())
      .then((json) => setSlots(json.slots ?? []))
      .finally(() => setLoading(false))
  }, [staffId, serviceId, date])

  return { slots, loading }
}
