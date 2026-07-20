'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { StepBusiness } from './StepBusiness'
import { StepServices } from './StepServices'
import { StepStaff } from './StepStaff'
import { StepSchedule } from './StepSchedule'
import { StepDone } from './StepDone'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = ['Negocio', 'Servicios', 'Barberos', 'Horarios', 'Listo']

export interface OnboardingState {
  businessId: string | null
  staffIds: string[]
  serviceIds: string[]
}

export default function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<OnboardingState>({
    businessId: null,
    staffIds: [],
    serviceIds: [],
  })

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)) }
  function prev() { setStep((s) => Math.max(s - 1, 0)) }

  function updateState(patch: Partial<OnboardingState>) {
    setState((s) => ({ ...s, ...patch }))
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10">
      {/* Progress */}
      <div className="flex items-center justify-between mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-0">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'grid place-items-center size-8 rounded-full text-sm font-medium transition-all',
                  i < step
                    ? 'bg-primary text-white'
                    : i === step
                    ? 'bg-primary/15 text-primary ring-2 ring-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {i < step ? <CheckCircle2 className="size-4" /> : i + 1}
              </div>
              <span className={cn('text-xs hidden sm:block', i === step ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px w-10 sm:w-16 mx-1 mt-[-18px]', i < step ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/30">
        {step === 0 && (
          <StepBusiness state={state} updateState={updateState} onNext={next} />
        )}
        {step === 1 && (
          <StepServices state={state} updateState={updateState} onNext={next} onBack={prev} />
        )}
        {step === 2 && (
          <StepStaff state={state} updateState={updateState} onNext={next} onBack={prev} />
        )}
        {step === 3 && (
          <StepSchedule state={state} updateState={updateState} onNext={next} onBack={prev} />
        )}
        {step === 4 && (
          <StepDone state={state} />
        )}
      </div>
    </div>
  )
}
