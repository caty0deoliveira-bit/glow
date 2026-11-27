-- Glow by Caty · Fase 2: suscripciones
-- Solo se guarda lo mínimo: quién pagó (id anónimo del móvil), plan y estado.
-- Nada de fotos, cuestionario ni datos de salud.

create table if not exists public.suscripciones (
  stripe_subscription text primary key,
  user_id      uuid references auth.users(id) on delete set null,
  plan         text not null check (plan in ('esencial','caty')),
  estado       text not null,
  stripe_customer text,
  email        text,
  creado       timestamptz not null default now(),
  actualizado  timestamptz not null default now()
);
create index if not exists suscripciones_user_idx on public.suscripciones(user_id);
alter table public.suscripciones enable row level security;

drop policy if exists "cada usuaria ve sus suscripciones" on public.suscripciones;
create policy "cada usuaria ve sus suscripciones" on public.suscripciones
  for select to authenticated using (auth.uid() = user_id);

revoke all on public.suscripciones from anon, authenticated;
grant select (plan, estado, actualizado, user_id) on public.suscripciones to authenticated;

-- Eventos de Stripe ya procesados (para no procesar dos veces el mismo)
create table if not exists public.eventos_stripe (
  id text primary key,
  tipo text not null,
  recibido timestamptz not null default now()
);
alter table public.eventos_stripe enable row level security;
revoke all on public.eventos_stripe from anon, authenticated;

-- El servidor (webhook) necesita leer y escribir ambas tablas
grant select, insert, update on public.suscripciones to service_role;
grant select, insert on public.eventos_stripe to service_role;
