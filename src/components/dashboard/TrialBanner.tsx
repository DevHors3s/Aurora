import { AlertTriangle, Clock } from 'lucide-react'
import { isBusinessActive, isTrialExpired, trialDaysLeft, planLabel } from '@/lib/plans'
import type { Business } from '@/types'

export function TrialBanner({ business }: { business: Pick<Business, 'plan' | 'trial_ends_at' | 'subscription_status'> }) {
  const active = isBusinessActive(business)

  if (!active) {
    const reason = business.plan === 'trial' && isTrialExpired(business.trial_ends_at)
      ? 'Tu prueba gratuita termino.'
      : 'Tu suscripcion no esta activa.'
    return (
      <div className="flex items-center gap-3 border-b border-red-500/30 bg-red-500/10 px-6 py-3 text-sm text-red-300">
        <AlertTriangle className="size-4 shrink-0" />
        <span>
          {reason} Tu pagina de reservas dejo de aceptar citas nuevas y el dashboard esta en modo solo lectura.
          Escribenos para activar tu plan y seguir recibiendo reservas.
        </span>
      </div>
    )
  }

  if (business.plan === 'trial') {
    const daysLeft = trialDaysLeft(business.trial_ends_at)
    if (daysLeft <= 3) {
      return (
        <div className="flex items-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm text-amber-300">
          <Clock className="size-4 shrink-0" />
          <span>
            {daysLeft <= 0 ? 'Tu prueba gratuita termina hoy.' : `Tu prueba gratuita termina en ${daysLeft} dia${daysLeft === 1 ? '' : 's'}.`}
            {' '}Actualiza a un plan pago para no perder tus reservas.
          </span>
        </div>
      )
    }
  }

  return null
}

/** Texto corto para mostrar el plan actual en el sidebar o settings. */
export function planStatusLabel(business: Pick<Business, 'plan' | 'trial_ends_at' | 'subscription_status'>): string {
  if (!isBusinessActive(business)) return 'Inactivo'
  return planLabel(business.plan)
}
