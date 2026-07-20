'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import type { OnboardingState } from './OnboardingWizard'

export function StepDone({ state }: { state: OnboardingState }) {
  const router = useRouter()
  return (
    <div className="text-center space-y-6 py-4">
      <div className="mx-auto grid place-items-center size-16 rounded-full bg-emerald-500/15 text-emerald-400">
        <CheckCircle2 className="size-8" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold">Todo listo</h2>
        <p className="mt-2 text-muted-foreground">
          Tu negocio esta configurado. Ahora puedes compartir tu link de reservas con tus clientes.
        </p>
      </div>
      <div className="space-y-3">
        <Button
          className="w-full bg-primary hover:bg-primary/90 gap-2"
          onClick={() => router.push('/dashboard')}
        >
          Ir al dashboard <ArrowRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/settings')}
        >
          Configurar mas detalles
        </Button>
      </div>
    </div>
  )
}
