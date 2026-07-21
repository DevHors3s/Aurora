@AGENTS.md

# Aurora

SaaS de agendamiento de citas/reservas (booking) para negocios de servicios (ej. barberías, salones). Multi-tenant: cada negocio (`business`) tiene su propio staff, servicios, horarios y página pública de reservas.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Supabase (Postgres + Auth) vía `@supabase/ssr`
- next-intl para i18n (`es`/`en`, default `es`), locale guardado en cookie `locale`
- Tailwind CSS 4 + Radix UI + shadcn-style components (`components.json`)
- react-hook-form + zod para formularios
- Resend (email) y Twilio (WhatsApp/SMS) para notificaciones/recordatorios
- Vercel Cron (`vercel.json`) llama `/api/cron/reminders` cada 30 min

## Estructura

- `src/app/(auth)` — login, registro, forgot-password
- `src/app/(dashboard)` — panel privado del dueño del negocio: agenda, appointments, staff, services, settings
- `src/app/b/[slug]` — página pública de reservas de un negocio (por su slug)
- `src/app/api/` — appointments, availability, bookings, cron/reminders, webhooks/twilio
- `src/lib/availability.ts` — cálculo de slots disponibles por staff/día/servicio, evitando choques con citas existentes
- `src/lib/reminders.ts` — programa recordatorios (confirmación, 24h, 1h antes) en la tabla `reminders`; el envío real lo hace el cron
- `src/lib/whatsapp.ts`, `src/lib/email.ts` — envío de notificaciones (Twilio/Resend)
- `supabase/migrations/` — esquema: `businesses`, `staff`, `services`, `staff_services`, `schedules`, `appointments`, `reminders`

## Convenciones específicas de este repo

- El middleware de Next no se llama `middleware.ts` sino **`proxy.ts`**, y exporta una función `proxy()` (no `middleware()`). Protege rutas del dashboard y redirige `/login`↔`/dashboard` según sesión de Supabase.
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
