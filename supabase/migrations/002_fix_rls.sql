-- 002_fix_rls.sql
--
-- Corrige dos problemas de la migracion inicial:
--
-- 1. Fuga de datos: "Public read appointments" (using (true)) dejaba leer con la
--    anon key el nombre y telefono de TODAS las citas de TODOS los negocios.
--    La disponibilidad ahora se calcula server-side con el cliente admin
--    (ver src/lib/availability.ts) y solo se exponen strings de hora ('09:00'),
--    nunca las filas de `appointments`. El anon ya no necesita leer esta tabla.
--
-- 2. Doble reserva: no existia ninguna proteccion a nivel de base de datos contra
--    dos reservas simultaneas para el mismo staff en el mismo horario; solo habia
--    un filtro optimista en memoria. Se agrega un exclusion constraint.
--
-- Nota sobre escritura publica: el flujo de reserva anonimo (POST /api/bookings)
-- y la programacion de recordatorios pasan a usar el cliente admin (service role),
-- que ignora RLS por completo. Por eso esta migracion NO agrega policies de INSERT
-- para el rol anon en `appointments` ni `reminders` — toda esa superficie queda
-- controlada por codigo de servidor, no por RLS.

-- 1. Quitar la lectura publica de appointments
drop policy if exists "Public read appointments" on appointments;

-- 2. Acotar la lectura publica de staff_services a vinculos de staff activo
--    (antes era `using (true)`, exponia el negocio de un staff dado de baja)
drop policy if exists "Public read staff_services" on staff_services;
create policy "Public read staff_services" on staff_services
  for select using (
    staff_id in (select id from staff where is_active = true)
  );

-- 3. Explicitar el "with check" en las policies de dueño. Con solo `using`,
--    Postgres ya aplicaba la misma condicion a INSERT/UPDATE, pero dejarlo
--    implicito es fragil si estas policies se tocan mas adelante.
drop policy if exists "Owners manage business" on businesses;
create policy "Owners manage business" on businesses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Owners manage staff" on staff;
create policy "Owners manage staff" on staff
  for all
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

drop policy if exists "Owners manage services" on services;
create policy "Owners manage services" on services
  for all
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

drop policy if exists "Owners manage appointments" on appointments;
create policy "Owners manage appointments" on appointments
  for all
  using (business_id in (select id from businesses where owner_id = auth.uid()))
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

-- 4. Anti doble-reserva a nivel de base de datos: ningun staff puede tener dos
--    citas activas (pending/confirmed) que se solapen en el tiempo. Esta es la
--    garantia real; el filtro de slots libres en la app es solo optimizacion.
create extension if not exists btree_gist;

alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
  where (status in ('pending', 'confirmed'));
