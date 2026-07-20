-- Habilitar extensiones
create extension if not exists "uuid-ossp";

-- BUSINESSES
create table businesses (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users(id) on delete cascade not null,
  name            text not null,
  slug            text unique not null,
  logo_url        text,
  phone           text,
  address         text,
  timezone        text default 'America/Lima',
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- STAFF
create table staff (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid references businesses(id) on delete cascade not null,
  name            text not null,
  avatar_url      text,
  bio             text,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- SERVICES
create table services (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid references businesses(id) on delete cascade not null,
  name            text not null,
  duration_min    integer not null,
  price           numeric(10,2),
  description     text,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- STAFF_SERVICES
create table staff_services (
  staff_id        uuid references staff(id) on delete cascade,
  service_id      uuid references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- SCHEDULES
create table schedules (
  id              uuid primary key default gen_random_uuid(),
  staff_id        uuid references staff(id) on delete cascade not null,
  day_of_week     integer not null check (day_of_week between 0 and 6),
  start_time      time not null,
  end_time        time not null,
  is_active       boolean default true
);

-- APPOINTMENTS
create table appointments (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid references businesses(id) on delete cascade not null,
  staff_id        uuid references staff(id),
  service_id      uuid references services(id),
  client_name     text not null,
  client_phone    text not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  status          text default 'confirmed' check (status in (
                    'pending','confirmed','completed','cancelled','no_show'
                  )),
  notes           text,
  created_at      timestamptz default now()
);

-- REMINDERS
create table reminders (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid references appointments(id) on delete cascade not null,
  type            text not null check (type in (
                    'confirmation','reminder_24h','reminder_1h'
                  )),
  scheduled_at    timestamptz not null,
  sent_at         timestamptz,
  status          text default 'pending' check (status in ('pending','sent','failed')),
  error_message   text,
  created_at      timestamptz default now()
);

-- INDICES
create index idx_appointments_business_id on appointments(business_id);
create index idx_appointments_staff_id on appointments(staff_id);
create index idx_appointments_starts_at on appointments(starts_at);
create index idx_appointments_status on appointments(status);
create index idx_reminders_status on reminders(status);
create index idx_reminders_scheduled_at on reminders(scheduled_at);
create index idx_businesses_slug on businesses(slug);

-- TRIGGER updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger businesses_updated_at
  before update on businesses
  for each row execute function handle_updated_at();

-- ROW LEVEL SECURITY
alter table businesses enable row level security;
alter table staff enable row level security;
alter table services enable row level security;
alter table staff_services enable row level security;
alter table schedules enable row level security;
alter table appointments enable row level security;
alter table reminders enable row level security;

-- POLICIES: gestion por owner
create policy "Owners manage business" on businesses
  for all using (owner_id = auth.uid());

create policy "Owners manage staff" on staff
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Owners manage services" on services
  for all using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Owners manage staff_services" on staff_services
  for all using (
    staff_id in (
      select s.id from staff s
      join businesses b on s.business_id = b.id
      where b.owner_id = auth.uid()
    )
  );

create policy "Owners manage schedules" on schedules
  for all using (
    staff_id in (
      select s.id from staff s
      join businesses b on s.business_id = b.id
      where b.owner_id = auth.uid()
    )
  );

create policy "Owners manage appointments" on appointments
  for all using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Owners view reminders" on reminders
  for select using (
    appointment_id in (
      select a.id from appointments a
      join businesses b on a.business_id = b.id
      where b.owner_id = auth.uid()
    )
  );

-- POLICIES: lectura publica (pagina de reservas)
create policy "Public read businesses" on businesses
  for select using (is_active = true);
create policy "Public read staff" on staff
  for select using (is_active = true);
create policy "Public read services" on services
  for select using (is_active = true);
create policy "Public read staff_services" on staff_services
  for select using (true);
create policy "Public read schedules" on schedules
  for select using (is_active = true);
create policy "Public read appointments" on appointments
  for select using (true);
