'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Smartphone } from 'lucide-react'
import type { BookingState } from './BookingFlow'
import type { Appointment } from '@/types'

interface Props {
  state: BookingState
  businessId: string
  depositAmount: number | null
  yapePhone: string | null
  yapeQrUrl: string | null
  onBook: (appt: Appointment) => void
  onBack: () => void
}

export function DepositStep({ state, businessId, depositAmount, yapePhone, yapeQrUrl, onBook, onBack }: Props) {
  const t = useTranslations('booking.deposit_step')
  const [ref, setRef] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!ref.trim()) { toast.error(t('error_ref')); return }
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
        client_name: state.clientName,
        client_phone: state.clientPhone,
        deposit_ref: ref,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(json.error ?? 'Error al reservar'); return }
    onBook(json.appointment as Appointment)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{t('title')}</h2>
        <p className="text-sm text-zinc-500">{t('subtitle')}</p>
      </div>

      {!yapePhone ? (
        <p className="text-center text-zinc-500 text-sm py-6">{t('no_yape')}</p>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
          {depositAmount != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">{t('amount_label')}</span>
              <span className="text-lg font-bold text-[#7C3AED]">S/. {depositAmount}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="size-4 text-[#7C3AED] shrink-0" />
            <span className="text-zinc-500">{t('yape_to')}:</span>
            <span className="font-semibold text-zinc-900">{yapePhone}</span>
          </div>
          {yapeQrUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={yapeQrUrl} alt="QR de Yape" className="mx-auto w-40 h-40 rounded-lg border border-zinc-200 object-contain bg-white" />
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="depositRef" className="text-zinc-700">{t('ref_label')}</Label>
        <Input
          id="depositRef"
          placeholder={t('ref_placeholder')}
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="border-zinc-200"
          disabled={!yapePhone}
        />
        <p className="text-xs text-zinc-400">{t('ref_hint')}</p>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-500">{t('back')}</Button>
        <Button onClick={submit} disabled={loading || !yapePhone} className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
          {loading ? <Loader2 className="size-4 animate-spin" /> : t('submit')}
        </Button>
      </div>
    </div>
  )
}
