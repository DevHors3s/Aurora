# Aurora

SaaS de agendamiento de citas/reservas para negocios de servicios (barberías,
salones) en Lima, Perú. Landing + dashboard multi-tenant + página pública de
reservas, todo en este mismo repo (ver `CLAUDE.md` para la arquitectura
completa).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Postgres + Auth) ·
next-intl (es/en) · Tailwind CSS 4 + Radix UI · Resend (email) · Twilio (WhatsApp).

## Setup local

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Crear un proyecto en [Supabase](https://supabase.com/dashboard)** y copiar
   `.env.example` a `.env.local`, completando `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (Project
   Settings → API). El resto de variables son opcionales para desarrollar
   localmente — ver los comentarios en `.env.example`.

3. **Aplicar las migraciones**, en orden, desde el SQL Editor de Supabase (o
   con `supabase db push` si tienes el proyecto vinculado con la CLI):

   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_fix_rls.sql
   supabase/migrations/003_deposits.sql
   supabase/migrations/004_plans.sql
   ```

   `002` corrige un problema de seguridad de la migración inicial (lectura
   pública de todas las citas) y agrega la protección contra doble-reserva —
   no es opcional, sin ella el flujo de reservas no funciona en absoluto (ver
   detalle en el propio archivo).

4. (Opcional) **Generar los tipos reales de Supabase**, una vez que el
   proyecto exista:

   ```bash
   npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/supabase/types.ts
   ```

   El archivo actual (`src/lib/supabase/types.ts`) está escrito a mano como
   documentación del esquema, pero **no** está conectado a los clientes de
   Supabase (`src/lib/supabase/{client,server,admin}.ts`): se intentó y rompió
   la build, porque le faltan los metadatos de `Relationships` que
   `supabase-js` necesita para resolver selects con joins embebidos
   (`staff(*)`, `service:services(*)`). El comando de arriba sí genera esos
   metadatos correctamente — una vez generado, conectarlo con
   `createServerClient<Database>(...)` (y lo mismo en `client.ts`/`admin.ts`)
   y correr `npx tsc --noEmit` para limpiar los casts `as X` que ya no hagan falta.

5. **Levantar el servidor**

   ```bash
   npm run dev
   ```

   Crea una cuenta desde `/register`, completa el wizard de onboarding, copia
   tu link de reservas desde `/settings` y pruébalo en una pestaña de
   incógnito.

## Activar un cliente que paga (MVP, manual)

No hay pasarela de pago integrada todavía — el cobro es por Yape/transferencia
directa y la activación es manual, en el SQL Editor de Supabase:

```sql
update businesses
set plan = 'starter',              -- o 'pro'
    subscription_status = 'active'
where slug = 'el-slug-del-negocio';
```

Para suspender a alguien que dejó de pagar:

```sql
update businesses set subscription_status = 'past_due' where slug = '...';
```

Con `subscription_status` en `past_due` o `cancelled`, o con un trial vencido
(`plan = 'trial'` y `trial_ends_at` en el pasado), el negocio entra en modo
solo lectura: su página `/b/[slug]` deja de aceptar reservas nuevas y el
dashboard muestra un banner de aviso (`src/lib/plans.ts`,
`src/components/dashboard/TrialBanner.tsx`).

## Adelanto por Yape

Cada negocio puede activar, desde `/settings`, que sus reservas pidan un
adelanto: el cliente ve el número/QR de Yape del negocio, paga por su cuenta y
escribe el código de operación al reservar. La cita queda en estado
`pending` hasta que el dueño la confirma con un clic en el dashboard viendo
ese código contra su propia app de Yape — no hay integración bancaria (Plin no
tiene API pública) ni subida de comprobante, deliberadamente, para mantener el
MVP simple.

## Recordatorios de WhatsApp

Dos vías, pensadas para etapas distintas:

- **Asistida (activa hoy):** el dashboard arma el mensaje y el dueño lo manda
  con un clic desde su propio WhatsApp (link `wa.me`, sin costo ni
  verificación de negocio). Ver `src/lib/wa-link.ts` y el widget "Recordatorios
  de mañana" en `/dashboard`.
- **Automática vía Twilio/WABA (lista, pero dormida):** `src/lib/whatsapp.ts`
  y el cron en `src/app/api/cron/reminders/route.ts` ya están completos. Se
  activan solos en cuanto `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` estén en las
  variables de entorno — requiere verificar el negocio ante Meta y las
  plantillas de mensaje aprobadas, y cuesta por mensaje en soles.

## Cron de recordatorios

`vercel.json` configura un cron cada 30 minutos contra `/api/cron/reminders`,
protegido con el header `Authorization: Bearer $CRON_SECRET`. Al desplegar en
Vercel, `CRON_SECRET` debe estar configurado en las variables de entorno del
proyecto para que el cron se autentique.

## Deploy

Cualquier hosting compatible con Next.js 16 sirve; el repo está pensado para
Vercel (por el cron de `vercel.json`). Recordar configurar **todas** las
variables de `.env.example` en el proyecto de Vercel, no solo las públicas —
`SUPABASE_SERVICE_ROLE_KEY` y `CRON_SECRET` son imprescindibles para que
reservas públicas y recordatorios funcionen en producción.
