'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { format, addDays, isToday } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import type { Service, Staff } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  service: Service
  staff: Staff
  date: string
  time: string
  onChange: (date: string, time: string) => void
  onNext: () => void
  onBack: () => void
}

export function DateTimePicker({ service, staff, date, time, onChange, onNext, onBack }: Props) {
  const t = useTranslations('booking.date_picker')
  const locale = useLocale()
  const dateLocale = locale === 'en' ? enUS : es
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))

  useEffect(() => {
    if (!date) return
    setLoadingSlots(true)
    fetch(`/api/availability?staff_id=${staff.id}&service_id=${service.id}&date=${date}`)
      .then(r => r.json())
      .then(j => setSlots(j.slots ?? []))
      .finally(() => setLoadingSlots(false))
  }, [date, staff.id, service.id])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{t('title')}</h2>
        <p className="text-sm text-zinc-500">{t('subtitle')}</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map(d => {
          const key = format(d, 'yyyy-MM-dd')
          const selected = date === key
          return (
            <button
              key={key}
              onClick={() => { onChange(key, ''); setSlots([]) }}
              className={cn(
                'flex flex-col items-center min-w-[52px] rounded-xl border p-2.5 transition',
                selected ? 'border-[#7C3AED] bg-[#7C3AED] text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#7C3AED]/40'
              )}
            >
              <span className="text-[10px] uppercase font-medium opacity-75">{format(d, 'EEE', { locale: dateLocale })}</span>
              <span className="text-lg font-bold leading-tight">{format(d, 'd')}</span>
              {isToday(d) && <span className="text-[8px] mt-0.5 opacity-75">{t('today')}</span>}
            </button>
          )
        })}
      </div>

      {/* Time slots */}
      {date && (
        <div>
          {loadingSlots ? (
            <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin text-zinc-400" /></div>
          ) : slots.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-6">{t('no_slots')}</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map(slot => (
                <button
                  key={slot}
                  onClick={() => onChange(date, slot)}
                  className={cn(
                    'rounded-lg border py-2 text-sm font-medium transition',
                    time === slot ? 'border-[#7C3AED] bg-[#7C3AED] text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#7C3AED]/60'
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-500">{t('back')}</Button>
        <Button onClick={onNext} disabled={!date || !time} className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
          {t('continue')}
        </Button>
      </div>
    </div>
  )
}
