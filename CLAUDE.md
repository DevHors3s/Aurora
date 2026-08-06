@AGENTS.md

# Aurora

SaaS de agendamiento de citas/reservas (booking) para negocios de servicios (ej. barberías, salones). Multi-tenant: cada negocio (`business`) tiene su propio staff, servicios, horarios y página pública de reservas.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Supabase (Postgres + Auth) vía `@supabase/ssr` (cliente con sesión) y `@supabase/supabase-js` (cliente admin, ver abajo)
- `@date-fns/tz` para manejar la zona horaria del negocio (`businesses.timezone`, default `America/Lima`) en el cálculo de disponibilidad
- next-intl para i18n (`es`/`en`, default `es`), locale guardado en cookie `locale`
- Tailwind CSS 4 + Radix UI + shadcn-style components (`components.json`)
- react-hook-form + zod están instalados pero **no se usan** — los formularios son `useState` a mano. No asumir que existe validación con zod en un form solo porque el paquete está en `package.json`.
- Resend (email) y Twilio (WhatsApp/SMS) para notificaciones/recordatorios — ver más abajo, ninguno de los dos está realmente activo hoy
- Vercel Cron (`vercel.json`) llama `/api/cron/reminders` cada 30 min

## Estructura

- `src/app/(auth)` — login, registro, forgot-password, reset-password
- `src/app/auth/callback/route.ts` — exchange de código PKCE al que Supabase redirige tras confirmar email o pedir reset de password. Sin esto esos dos flujos no completan.
- `src/app/(dashboard)` — panel privado del dueño del negocio: agenda, appointments, staff, services, settings. `layout.tsx` calcula si el negocio está activo (trial/plan pago vigente) y muestra `TrialBanner` si no.
- `src/app/b/[slug]` — página pública de reservas de un negocio (por su slug). Flujo de 4 o 5 pasos (`BookingFlow.tsx`): Servicio → Staff → Fecha/hora → Datos del cliente → **Adelanto por Yape** (solo si `business.deposit_enabled`).
- `src/app/api/` — appointments (incluye verificación de adelanto), availability, bookings, reminders/[id] (marcar recordatorio como enviado), cron/reminders, webhooks/twilio (stub sin implementar)
- `src/lib/supabase/admin.ts` — cliente con `SUPABASE_SERVICE_ROLE_KEY`, **ignora RLS**. Server-only, nunca importar desde `'use client'`. Ver sección de RLS abajo.
- `src/lib/tz.ts` — conversión entre fecha/hora "de pared" del negocio y `Date` UTC real (`zonedTimeToUtc`, `dayOfWeekFromYMD`, `todayInZone`). Usar siempre esto para slots/disponibilidad, nunca `new Date(\`${date}T${time}\`)` a secas (eso usa la hora local del servidor, que en Vercel es UTC).
- `src/lib/availability.ts` — cálculo de slots disponibles por staff/día/servicio con timezone real, evitando choques con citas existentes. Usa el cliente admin (el visitante público no puede leer `appointments` directamente, ver RLS abajo).
- `src/lib/reminders.ts` — programa recordatorios (`confirmation`, `reminder_24h`) en la tabla `reminders` vía cliente admin; `reminder_1h` existe en el enum de la DB por compatibilidad pero ya no se programa. `cancelReminders()` borra los pendientes de una cita cancelada.
- `src/lib/whatsapp.ts` — plantillas y envío real vía Twilio (WABA), pero **dormido**: sin `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` en el entorno, `sendWhatsApp()` hace no-op con un `console.log`. No asumir que los mensajes salen de verdad sin verificar esas env vars.
- `src/lib/wa-link.ts` — el canal que **sí** funciona hoy: helpers client-safe (`buildWaLink`, `tplReminderText`) para armar links `wa.me` con el mensaje pre-cargado, que el dueño manda con 1 clic desde su propio WhatsApp. Deliberadamente separado de `whatsapp.ts` (que importa `twilio`, paquete solo-servidor) para poder usarse desde componentes `'use client'`.
- `src/lib/plans.ts` — única fuente de verdad de precios/límites por plan (`PLANS.starter`, `PLANS.pro`) y de si un negocio está activo (`isBusinessActive`). El landing (`src/app/page.tsx`) y el gating de `/api/bookings` leen de acá, no hardcodean precios.
- `src/lib/email.ts` — implementación completa con Resend, pero **no se llama desde ningún flujo** (el booking público no pide email del cliente). No asumir que se envían emails.
- `supabase/migrations/` — 4 archivos, aplicar en orden. `001` es el esquema base. `002_fix_rls.sql` corrige una fuga real (lectura pública de `appointments`) y agrega el exclusion constraint anti-doble-reserva — **no es opcional**. `003_deposits.sql` agrega columnas de adelanto por Yape. `004_plans.sql` agrega columnas de plan/trial/suscripción.

## Modelo de escrituras: dueño autenticado (RLS) vs. visitante público (cliente admin)

Hay dos caminos de escritura y **no se deben mezclar**:

- **Dueño autenticado** (dashboard): usa `src/lib/supabase/server.ts` o `client.ts` (cliente con cookies/sesión). RLS scoped por `owner_id = auth.uid()` protege todo — así debe seguir siendo, no hay que agregar policies públicas de escritura para esto.
- **Visitante anónimo** (`/b/[slug]`, `/api/bookings`, `/api/availability`, cron de recordatorios): no tiene `auth.uid()`, y tras `002_fix_rls.sql` el rol `anon` **no tiene ningún permiso de INSERT/UPDATE** en `appointments` ni `reminders`, ni de SELECT en `appointments`. Estas rutas usan `createAdminClient()` (`src/lib/supabase/admin.ts`, service role) y validan todo a mano en el código de la ruta (negocio activo, servicio/staff pertenecen al negocio, slot sigue libre, límite de plan). Si se agrega una ruta pública nueva que necesite leer/escribir citas, seguir este mismo patrón — **no** agregar una policy `using (true)` como parche, esa fue exactamente la fuga que se corrigió.

## Adelanto por Yape

Cada negocio puede pedir un adelanto al reservar (`businesses.deposit_enabled/deposit_amount/yape_phone/yape_qr_url`, configurable en `/settings`). Con adelanto activo, la cita nace en `status: 'pending'` / `deposit_status: 'pending'` con el código de operación que escribió el cliente (`appointments.deposit_ref`); el dueño la confirma o rechaza con 1 clic en el dashboard (`AppointmentCard.tsx`, `AppointmentsClient.tsx`) contra su propia app de Yape — no hay integración bancaria real, es verificación manual por diseño. Recién al confirmar se programa el recordatorio de 24h y se manda la confirmación.

## Planes y gating

`businesses.plan` (`trial|starter|pro`), `trial_ends_at`, `subscription_status`. Sin pasarela de pago: el cobro es manual (Yape/transferencia) y la activación es un `UPDATE` a mano en Supabase Studio — ver `README.md`. `isBusinessActive()` en `src/lib/plans.ts` decide si un negocio puede operar; si no, `/api/bookings` rechaza reservas nuevas (403) y el dashboard muestra `TrialBanner`. El gating **no** deshabilita cada botón de CRUD individual del dashboard, solo lo que importa de cara al negocio (ver `docs/PENDIENTES.md`).

## Tipos de Supabase

`src/lib/supabase/types.ts` documenta el esquema a mano pero **no está conectado** a los clientes (`createServerClient<Database>(...)` rompe la build: falta el metadata de `Relationships` que `supabase-js` necesita para joins embebidos tipo `staff(*)`). Sigue usándose `as X` para castear resultados de queries. No intentar conectar el generic sin antes correr `supabase gen types` contra un proyecto real — ver `docs/PENDIENTES.md`.

## Pendientes conocidos

`docs/PENDIENTES.md` lista lo que falta por hacer a mano (crear el proyecto de Supabase, aplicar migraciones, configurar env vars, salir a vender, etc.) y la deuda técnica descartada a propósito. Consultarlo antes de asumir que algo "falta implementar" — puede que ya esté ahí documentado como decisión deliberada.

## Convenciones específicas de este repo

- El middleware de Next no se llama `middleware.ts` sino **`proxy.ts`**, y exporta una función `proxy()` (no `middleware()`). Protege rutas del dashboard (incluyendo `/reset-password`, que solo debe verse con sesión de recuperación válida) y redirige `/login`↔`/dashboard` según sesión de Supabase.
- Los textos de UI van en `messages/es.json` / `messages/en.json`, no hardcodeados.
- Comentarios de negocio (reglas de disponibilidad, etc.) están en español, siguiendo el estilo existente en `src/lib`.

## Next.js 16: breaking changes relevantes para este repo

`AGENTS.md` pide leer `node_modules/next/dist/docs/` antes de tocar código porque esta versión (16.2.6) sí trae cambios de ruptura frente a lo que la mayoría de modelos conoce (entrenados con Next ≤15). Nota: en algún punto la instalación local quedó corrupta (lockfile pineaba `next@9.3.3`, incompatible con el `^16` que pide `next-intl`) y por eso esa carpeta de docs no aparecía — ya se corrigió con una reinstalación limpia. Lo que aplica a este proyecto:

- **`middleware.ts` → `proxy.ts`**: ya migrado en este repo (`proxy.ts` exporta `proxy()`, no `middleware()`). No usar el nombre/convención antiguos.
- **APIs de request asíncronas**: `cookies()`, `headers()`, `params`, `searchParams` son siempre `Promise` y deben `await`-earse (ya se sigue en `src/i18n/request.ts`, `proxy.ts`, rutas dinámicas).
- **Turbopack por defecto** en `next dev`/`next build`; ya no hace falta `--turbopack`.
- **`revalidateTag`** ahora requiere un segundo argumento (`cacheLife` profile); si se usa cache tags en el futuro, revisar `next/cache`.
- **Rutas paralelas** requieren `default.js` explícito (no aplica aquí, no se usan parallel routes).
- Antes de asumir comportamiento "clásico" de Next (imports, config, convenciones de archivos), conviene revisar `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` si algo no cuadra con lo esperado.
