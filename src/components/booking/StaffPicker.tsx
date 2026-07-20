'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Staff } from '@/types'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronRight } from 'lucide-react'

interface Props {
  serviceId: string
  businessId: string
  selected: Staff | null
  onSelect: (s: Staff) => void
  onBack: () => void
}

export function StaffPicker({ serviceId, businessId, selected, onSelect, onBack }: Props) {
  const t = useTranslations('booking.staff_picker')
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('staff_services')
      .select('staff:staff_id(*)')
      .eq('service_id', serviceId)
      .then(({ data }) => {
        const list = (data ?? [])
          .map((d: { staff: Staff | Staff[] }) => (Array.isArray(d.staff) ? d.staff[0] : d.staff))
          .filter((s: Staff) => s?.is_active)
        setStaffList(list as Staff[])
        setLoading(false)
      })
  }, [serviceId])

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">{t('title')}</h2>
        <p className="text-sm text-zinc-500">{t('subtitle')}</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-zinc-400" /></div>
      ) : staffList.length === 0 ? (
        <p className="text-center text-zinc-500 py-8 text-sm">{t('no_staff')}</p>
      ) : (
        staffList.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition hover:border-[#7C3AED]/60 hover:bg-[#7C3AED]/5 ${
              selected?.id === s.id ? 'border-[#7C3AED] bg-[#7C3AED]/5' : 'border-zinc-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="grid place-items-center size-10 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] font-semibold text-sm">
                {s.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-zinc-900">{s.name}</p>
                {s.bio && <p className="text-xs text-zinc-500 line-clamp-1">{s.bio}</p>}
              </div>
            </div>
            <ChevronRight className="size-4 text-zinc-400 shrink-0" />
          </button>
        ))
      )}
      <Button variant="ghost" size="sm" onClick={onBack} className="w-full text-zinc-500">{t('back')}</Button>
    </div>
  )
}
