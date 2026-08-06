import type { Plan, SubscriptionStatus } from '@/types'

export const TRIAL_DAYS = 14

export interface PlanDef {
  id: 'starter' | 'pro'
  name: string
  price: number
  maxStaff: number | null // null = ilimitado
  maxAppointmentsPerMonth: number | null // null = ilimitado
  features: string[]
}

// Unica fuente de verdad de precios y limites: antes vivian hardcodeados en
// el JSX del landing (src/app/page.tsx) y no se aplicaban en ningun lado —
// se podian crear 10 barberos en el plan Starter sin que nada lo impidiera.
export const PLANS: Record<'starter' | 'pro', PlanDef> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    maxStaff: 3,
    maxAppointmentsPerMonth: 100,
    features: [
      '1 local',
      'Hasta 3 barberos',
      '100 citas / mes',
      'Adelanto por Yape',
      'Recordatorios por WhatsApp',
      'Link de reservas propio',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 99,
    maxStaff: null,
    maxAppointmentsPerMonth: null,
    features: [
      '1 local',
      'Barberos ilimitados',
      'Citas ilimitadas',
      'Todo Starter +',
      'Soporte prioritario',
    ],
  },
}

/** Durante el trial se aplican los limites de Starter (el plan pago mas bajo). */
export function limitsForPlan(plan: Plan): Pick<PlanDef, 'maxStaff' | 'maxAppointmentsPerMonth'> {
  return plan === 'pro' ? PLANS.pro : PLANS.starter
}

export function planLabel(plan: Plan): string {
  if (plan === 'trial') return 'Prueba gratuita'
  return PLANS[plan].name
}

export function isTrialExpired(trialEndsAt: string): boolean {
  return new Date(trialEndsAt).getTime() < Date.now()
}

export function trialDaysLeft(trialEndsAt: string): number {
  const ms = new Date(trialEndsAt).getTime() - Date.now()
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

interface BusinessPlanFields {
  plan: Plan
  trial_ends_at: string
  subscription_status: SubscriptionStatus
}

/**
 * Si el negocio puede operar con normalidad: aceptar reservas nuevas del
 * publico y editar desde el dashboard. false = solo lectura.
 */
export function isBusinessActive(business: BusinessPlanFields): boolean {
  if (business.subscription_status === 'cancelled' || business.subscription_status === 'past_due') return false
  if (business.plan === 'trial' && isTrialExpired(business.trial_ends_at)) return false
  return true
}
