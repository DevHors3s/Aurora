'use client'

import { useTranslations } from 'next-intl'
import type { Service } from '@/types'
import { Clock, ChevronRight } from 'lucide-react'

interface Props {
  services: Service[]
  selected: Service | null
  onSelect: (s: Service) => void
}

export function ServicePicker({ services, selected, onSelect }: Props) {
  const t = useTranslations('booking.service_picker')
  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">{t('title')}</h2>
        <p className="text-sm text-zinc-500">{t('subtitle')}</p>
      </div>
      {services.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition hover:border-[#7C3AED]/60 hover:bg-[#7C3AED]/5 ${
            selected?.id === s.id ? 'border-[#7C3AED] bg-[#7C3AED]/5' : 'border-zinc-200 bg-white'
          }`}
        >
          <div>
            <p className="font-medium text-zinc-900">{s.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="size-3" />{s.duration_min} {t('minutes')}
              </span>
              {s.price && <span className="text-xs font-medium text-[#7C3AED]">S/. {s.price}</span>}
            </div>
          </div>
          <ChevronRight className="size-4 text-zinc-400 shrink-0" />
        </button>
      ))}
    </div>
  )
}
