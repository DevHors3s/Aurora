'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import type { BookingState } from './BookingFlow'
import type { Appointment } from '@/types'

interface Props {
  state: BookingState
  businessId: string
  requiresDeposit?: boolean
  onContinue?: (name: string, phone: string) => void
  onBook: (appt: Appointment) => void
  onBack: () => void
}

export function ClientForm({ state, businessId, requiresDeposit, onContinue, onBook, onBack }: Props) {
  const t = useTranslations('booking.client_form')
  const locale = useLocale()
  const dateLocale = locale === 'en' ? enUS : es

  const [name, setName] = useState(state.clientName)
  const [phone, setPhone] = useState(state.clientPhone)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!name.trim()) { toast.error(t('error_name')); return }
    if (!phone.trim()) { toast.error(t('error_phone')); return }

    // Con adelanto: todavia falta el paso de Yape, no se reserva aqui.
    if (requiresDeposit) {
      onContinue?.(name, phone)
      return
    }

    setLoading(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId,
        service_id: state.service!.id,
        staff_id: state.staff!.id,
        date: state.date,
        time: state.time,
        client_name: name,
        client_phone: phone,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(json.error ?? t('error_generic')); return }
    onBook(json.appointment as Appointment)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{t('title')}</h2>
        <p className="text-sm text-zinc-500">{t('subtitle')}</p>
      </div>

      {/* Resumen */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-1 text-sm">
        <p><span className="text-zinc-500">{t('summary_service')}:</span> <span className="font-medium">{state.service?.name}</span></p>
        <p><span className="text-zinc-500">{t('summary_staff')}:</span> <span className="font-medium">{state.staff?.name}</span></p>
        <p><span className="text-zinc-500">{t('summary_date')}:</span> <span className="font-medium">
          {state.date ? format(new Date(state.date + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: dateLocale }) : '—'}
        </span></p>
        <p><span className="text-zinc-500">{t('summary_hour')}:</span> <span className="font-medium">{state.time || '—'}</span></p>
        {state.service?.price && <p><span className="text-zinc-500">{t('summary_price')}:</span> <span className="font-medium text-[#7C3AED]">S/. {state.service.price}</span></p>}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cname" className="text-zinc-700">{t('name_label')}</Label>
          <Input id="cname" placeholder={t('name_placeholder')} value={name} onChange={e => setName(e.target.value)} className="border-zinc-200" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cphone" className="text-zinc-700">{t('phone_label')}</Label>
          <Input id="cphone" placeholder={t('phone_placeholder')} value={phone} onChange={e => setPhone(e.target.value)} className="border-zinc-200" />
          <p className="text-xs text-zinc-400">{t('phone_hint')}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-500">{t('back')}</Button>
        <Button onClick={submit} disabled={loading} className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
          {loading ? <Loader2 className="size-4 animate-spin" /> : t('submit')}
        </Button>
      </div>
    </div>
  )
}
