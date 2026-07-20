import { useTranslations, useLocale } from 'next-intl'
import { CheckCircle2, MessageCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import type { Appointment } from '@/types'

interface Props {
  appointment: Appointment
  businessName: string
}

export function BookingConfirmation({ appointment, businessName }: Props) {
  const t = useTranslations('booking.confirmation')
  const locale = useLocale()
  const dateLocale = locale === 'en' ? enUS : es
  const starts = new Date(appointment.starts_at)

  return (
    <div className="text-center space-y-6 py-4">
      <div className="mx-auto grid place-items-center size-16 rounded-full bg-emerald-50 text-emerald-500">
        <CheckCircle2 className="size-8" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">{t('title')}</h2>
        <p className="text-sm text-zinc-500 mt-1">{t('subtitle')}</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left space-y-2 text-sm">
        <p className="font-semibold text-zinc-900">{businessName}</p>
        <div className="flex items-center gap-2 text-zinc-600">
          <Calendar className="size-4 shrink-0 text-[#7C3AED]" />
          {format(starts, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: dateLocale })}
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <MessageCircle className="size-4 shrink-0 text-[#7C3AED]" />
          {t('whatsapp')}
        </div>
      </div>
      <p className="text-xs text-zinc-400">{t('cancel_hint')}</p>
    </div>
  )
}
