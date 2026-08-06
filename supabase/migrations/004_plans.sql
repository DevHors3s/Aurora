-- 004_plans.sql
--
-- Monetizacion minima: trial de 14 dias + 2 planes (starter/pro). El cobro en
-- el MVP es manual por Yape/transferencia — no hay pasarela integrada. El
-- dueño de Aurora activa el pago cambiando estas columnas a mano en Supabase
-- Studio (ver README). Los limites y precios de cada plan viven en
-- src/lib/plans.ts, no en la base de datos.

alter table businesses
  add column plan text not null default 'trial'
    check (plan in ('trial', 'starter', 'pro')),
  add column trial_ends_at timestamptz not null default (now() + interval '14 days'),
  add column subscription_status text not null default 'active'
    check (subscription_status in ('active', 'past_due', 'cancelled'));

comment on column businesses.plan is
  'trial: periodo de prueba de 14 dias con limites de starter. starter/pro: plan pagado, activado a mano tras confirmar el pago por Yape.';
comment on column businesses.subscription_status is
  'active: puede operar con normalidad. past_due/cancelled: dashboard en solo-lectura y /b/[slug] deja de aceptar reservas nuevas.';
