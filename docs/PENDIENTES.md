# Pendientes — Aurora

Este documento junta todo lo que **queda por hacer a mano** después de la
sesión que desbloqueó el MVP (fases 0–3: RLS, timezone, adelanto por Yape,
planes, landing honesta — ver `git log` y `CLAUDE.md` para el contexto de
arquitectura). Son acciones que yo no puedo ejecutar por ti: crear cuentas,
tomar decisiones de negocio, o correr comandos que necesitan credenciales que
no existen en este entorno.

Está organizado por urgencia: **bloqueante** (nada funciona sin esto),
**antes de vender**, y **deuda técnica descartada a propósito**.

---

## 1. Bloqueante — sin esto el producto no funciona en absoluto

### 1.1 Crear el proyecto de Supabase y configurar `.env.local`

No existe ningún `.env` en el repo. Sin esto la app ni levanta.

1. Crear proyecto en [supabase.com/dashboard](https://supabase.com/dashboard).
2. Copiar `.env.example` → `.env.local`.
3. Completar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY` desde Project Settings → API.

### 1.2 Aplicar las migraciones, en orden

Desde el SQL Editor de Supabase (o `supabase db push` si vinculas la CLI):

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_fix_rls.sql
supabase/migrations/003_deposits.sql
supabase/migrations/004_plans.sql
```

`002` no es opcional: corrige una fuga de datos real (cualquiera con la anon
key podía leer nombre y teléfono de todas las citas de todos los negocios) y
agrega la protección contra doble-reserva. Sin ella, el flujo de reservas
tampoco inserta nada (RLS bloquea el INSERT anónimo).

### 1.3 Probar el flujo completo antes de mostrárselo a nadie

1. `npm run dev`.
2. Crear cuenta en `/register` → completar el wizard de onboarding.
3. Copiar el link de reservas desde `/settings`.
4. Abrirlo en una pestaña de incógnito y reservar.
5. Confirmar que la cita aparece en `/dashboard` con la **hora correcta**
   (verifica el fix de timezone).
6. Intentar reservar el mismo horario dos veces seguidas → la segunda debe
   fallar con "ese horario ya no está disponible", no crear una cita duplicada.

---

## 2. Antes de cobrarle a un cliente real

### 2.1 Configurar `CRON_SECRET` en Vercel

`vercel.json` ya define el cron de recordatorios cada 30 min contra
`/api/cron/reminders`. Sin `CRON_SECRET` en las variables de entorno del
proyecto de Vercel, ese endpoint devuelve 401 y el cron nunca hace nada
(fallo silencioso — no se ve en ningún lado a menos que revises los logs).

### 2.2 Decidir cómo activar el cobro manual

No hay pasarela de pago. El flujo pensado (documentado en `README.md`) es:

1. El negocio te paga por Yape/transferencia directa.
2. Vas al SQL Editor de Supabase y corres:
   ```sql
   update businesses
   set plan = 'starter', subscription_status = 'active'
   where slug = 'el-slug-del-negocio';
   ```

Esto es 100% manual — si escalas más allá de ~10 clientes esto se vuelve
inmanejable y ahí sí vale la pena mirar Culqi (tiene SDK con suscripciones y
webhooks, ~3.99% + S/0.60 por transacción).

### 2.3 Verificar si el dominio `aurora.pe` está disponible

El código ya lo asume en dos lugares:
- `src/lib/email.ts` → `from: 'Aurora <noreply@aurora.pe>'`
- Copy del landing (`aurora.pe/b/tu-barberia`)

Si no está disponible, hay que decidir el dominio real y actualizar esas dos
referencias (más `NEXT_PUBLIC_APP_URL` en producción).

### 2.4 Conseguir un número de WhatsApp real para el negocio de Aurora

No hay ningún link de contacto para que un cliente te escriba a pedir upgrade
de plan — a propósito no puse un número inventado en el banner de trial
(`src/components/dashboard/TrialBanner.tsx`) porque hubiera sido un dato
falso en el código. Si quieres ese link, dime el número y lo agrego.

### 2.5 Salir a vender

Los primeros 5 clientes se consiguen a pie, no con la landing: ir
presencialmente a barberías de Miraflores/Surco/San Isidro, mostrar la
reserva funcionando desde el celular, ofrecer los 14 días de prueba y
hacerles el setup tú mismo la primera vez.

---

## 3. Deuda técnica descartada a propósito (no bloquea, pero queda anotada)

### 3.1 Tipos de Supabase no conectados a los clientes

`src/lib/supabase/types.ts` está escrito a mano y documenta el esquema, pero
**no** está conectado a `client.ts`/`server.ts`/`admin.ts`. Lo intenté
(`createServerClient<Database>(...)`) y rompió la build entera: a un tipo
escrito a mano le falta el metadata de `Relationships` que `supabase-js`
necesita para resolver selects con joins embebidos (`staff(*)`,
`service:services(*)`), y sin eso cada query colapsa a `never`.

Una vez que el proyecto de Supabase exista (paso 1.1), correr:

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/supabase/types.ts
```

Eso sí genera los metadatos correctos. Después, conectar el tipo en los tres
clientes y correr `npx tsc --noEmit` para limpiar los casts `as X` que ya no
hagan falta.

### 3.2 Read-only completo del dashboard cuando el plan está vencido

Hoy, si `subscription_status` no está activo, se bloquea lo que de verdad
importa: `/b/[slug]` deja de aceptar reservas nuevas, y hay un banner bien
visible en el dashboard. Lo que **no** implementé es deshabilitar cada botón
de creación/edición individual (nuevo servicio, nuevo barbero, nueva cita
manual, etc.) — un dueño con el plan vencido técnicamente todavía puede
editar datos desde el dashboard. Es una decisión de alcance: el owner ya
tiene control total sobre su propia data vía RLS de todos modos, así que no
es un boquete de seguridad, solo una UX menos estricta de lo prometido.

### 3.3 Sin pasarela de pago, sin WABA activa, sin seed script

- **Culqi/Mercado Pago**: solo tiene sentido con volumen (~10 clientes
  pagando). Hasta entonces, cobro manual (ver 2.2).
- **WhatsApp automático (WABA vía Twilio)**: el código ya está completo en
  `src/lib/whatsapp.ts` y el cron — se activa solo con
  `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` en el entorno, pero requiere
  verificar el negocio ante Meta (días/semanas) y plantillas aprobadas.
  Mientras tanto, el flujo asistido (`wa.me`, ya activo) cumple la misma
  función sin esos requisitos.
- **Seed script**: no hay datos de demo. Si quieres hacer demos en vivo sin
  ensuciar una cuenta real, pide que se cree un script de seed.

### 3.4 Plan "Agencia" (multi-local) — descartado del pricing, no del roadmap

El esquema actual es un `owner_id` → un `business` (todo el dashboard usa
`.maybeSingle()`). Vender un plan de "hasta 5 locales" con este esquema sería
vender algo que no existe, así que se sacó del landing. Soportarlo de verdad
requiere rediseñar esa relación — avisa si en algún momento hay demanda real
de esto antes de construirlo.

---

## Cómo usar este documento

Cuando resuelvas un punto, bórralo de acá o táchalo — este archivo es para
lo que falta, no un historial. Si en una conversación futura me pides
"revisa qué falta", este es el archivo que voy a mirar primero.
