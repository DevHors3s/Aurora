-- 003_deposits.sql
--
-- Adelanto por Yape para confirmar la cita. Version manual: el cliente reserva,
-- ve el numero/QR de Yape de la barberia y escribe el codigo de operacion; el
-- dueño lo verifica con 1 clic en el dashboard antes de que la cita quede
-- confirmada. Sin pasarela de pago ni subida de comprobante (fuera del MVP).

alter table businesses
  add column deposit_enabled boolean not null default false,
  add column deposit_amount  numeric(10,2),
  add column yape_phone      text,
  add column yape_qr_url     text;

alter table appointments
  add column deposit_status text not null default 'not_required'
    check (deposit_status in ('not_required', 'pending', 'verified', 'rejected')),
  add column deposit_ref    text;

comment on column appointments.deposit_status is
  'not_required: el negocio no pide adelanto. pending: cliente reservo y dejo un codigo de operacion, falta que el dueño lo verifique. verified/rejected: el dueño ya lo reviso.';
comment on column appointments.deposit_ref is
  'Codigo de operacion de Yape que el cliente escribe al reservar. Verificado manualmente por el dueño contra su propia app de Yape.';
