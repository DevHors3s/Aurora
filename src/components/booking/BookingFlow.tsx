'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ServicePicker } from './ServicePicker'
import { StaffPicker } from './StaffPicker'
import { DateTimePicker } from './DateTimePicker'
import { ClientForm } from './ClientForm'
import { BookingConfirmation } from './BookingConfirmation'
import type { Service, Staff, Appointment } from '@/types'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BookingState {
  service: Service | null
  staff: Staff | null
  date: string
  time: string
  clientName: string
  clientPhone: string
}

export function BookingFlow({
  businessId,
  businessName,
  services,
}: {
  businessId: string
  businessName: string
  services: Service[]
}) {
  const t = useTranslations('booking')
  const steps = t.raw('steps') as string[]

  const [step, setStep] = useState(0)
  const [state, setState] = useState<BookingState>({
    service: null, staff: null, date: '', time: '', clientName: '', clientPhone: '',
  })
  const [appointment, setAppointment] = useState<Appointment | null>(null)

  function update(patch: Partial<BookingState>) { setState(prev => ({ ...prev, ...patch })) }
  function next() { setStep(s => s + 1) }
  function prev() { setStep(s => s - 1) }

  if (appointment) {
    return <BookingConfirmation appointment={appointment} businessName={businessName} />
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'grid place-items-center size-7 rounded-full text-xs font-semibold transition-all',
                i < step ? 'bg-[#7C3AED] text-white'
                : i === step ? 'ring-2 ring-[#7C3AED] text-[#7C3AED] bg-white'
                : 'bg-zinc-100 text-zinc-400'
              )}>
                {i < step ? <CheckCircle2 className="size-3.5" /> : i + 1}
              </div>
              <span className={cn('text-[10px]', i === step ? 'text-zinc-800 font-medium' : 'text-zinc-400')}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-px w-10 mx-1 mb-4', i < step ? 'bg-[#7C3AED]' : 'bg-zinc-200')} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <ServicePicker services={services} selected={state.service}
          onSelect={s => { update({ service: s, staff: null, date: '', time: '' }); next() }} />
      )}
      {step === 1 && state.service && (
        <StaffPicker serviceId={state.service.id} businessId={businessId} selected={state.staff}
          onSelect={st => { update({ staff: st, date: '', time: '' }); next() }} onBack={prev} />
      )}
      {step === 2 && state.service && state.staff && (
        <DateTimePicker service={state.service} staff={state.staff} date={state.date} time={state.time}
          onChange={(date, time) => update({ date, time })} onNext={next} onBack={prev} />
      )}
      {step === 3 && (
        <ClientForm state={state} businessId={businessId}
          onBook={appt => setAppointment(appt)} onBack={prev} />
      )}
    </div>
  )
}
