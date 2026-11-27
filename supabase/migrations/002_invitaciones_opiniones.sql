-- Glow by Caty · invitaciones de prueba (7 días de Glow Esencial) y opiniones de las testers

-- 1) Las suscripciones pueden caducar (invitaciones) y tener origen
alter table public.suscripciones add column if not exists vence timestamptz;
alter table public.suscripciones add column if not exists origen text not null default 'stripe';
grant select (vence) on public.suscripciones to authenticated;

-- Una invitación caducada deja de verse (y por tanto deja de dar acceso)
drop policy if exists "cada usuaria ve sus suscripciones" on public.suscripciones;
create policy "cada usuaria ve sus suscripciones" on public.suscripciones
  for select to authenticated using (auth.uid() = user_id and (vence is null or vence > now()));

-- 2) Invitaciones
create table if not exists public.invitaciones (
  codigo    text primary key,
  plan      text not null default 'esencial' check (plan in ('esencial','caty')),
  dias      int  not null default 7,
  usos_max  int  not null default 10,
  usos      int  not null default 0,
  caduca    timestamptz not null,
  nota      text,
  creado    timestamptz not null default now()
);
alter table public.invitaciones enable row level security;
revoke all on public.invitaciones from anon, authenticated;

create table if not exists public.canjes (
  codigo  text not null references public.invitaciones(codigo),
  user_id uuid not null references auth.users(id) on delete cascade,
  creado  timestamptz not null default now(),
  primary key (codigo, user_id)
);
alter table public.canjes enable row level security;
revoke all on public.canjes from anon, authenticated;

create or replace function public.canjear_invitacion(p_codigo text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare inv public.invitaciones; uid uuid := auth.uid(); v timestamptz;
begin
  if uid is null then raise exception 'sin_sesion'; end if;
  select * into inv from public.invitaciones where codigo = upper(trim(p_codigo)) for update;
  if not found then raise exception 'invitacion_no_valida'; end if;
  if exists (select 1 from public.canjes where codigo = inv.codigo and user_id = uid) then
    select vence into v from public.suscripciones where stripe_subscription = 'inv_' || uid;
    return v;
  end if;
  if inv.caduca < now() then raise exception 'invitacion_caducada'; end if;
  if inv.usos >= inv.usos_max then raise exception 'invitacion_agotada'; end if;
  v := now() + make_interval(days => inv.dias);
  insert into public.suscripciones (stripe_subscription, user_id, plan, estado, vence, origen)
    values ('inv_' || uid, uid, inv.plan, 'active', v, 'invitacion:' || inv.codigo)
    on conflict (stripe_subscription) do update set vence = excluded.vence, estado = 'active';
  insert into public.canjes (codigo, user_id) values (inv.codigo, uid);
  update public.invitaciones set usos = usos + 1 where codigo = inv.codigo;
  return v;
end $$;
revoke execute on function public.canjear_invitacion(text) from public, anon;
grant execute on function public.canjear_invitacion(text) to authenticated;

-- 3) Opiniones (solo se pueden enviar; las lee Caty en el panel de Supabase)
create table if not exists public.opiniones (
  id          bigint generated always as identity primary key,
  user_id     uuid default auth.uid() references auth.users(id) on delete set null,
  creado      timestamptz not null default now(),
  general     int check (general between 1 and 5),
  cuestionario int check (cuestionario between 1 and 5),
  rutina      int check (rutina between 1 and 5),
  asistente   int check (asistente between 1 and 5),
  texto       text check (char_length(texto) <= 2000),
  plan        text,
  version     text
);
alter table public.opiniones enable row level security;
revoke all on public.opiniones from anon, authenticated;
grant insert (general, cuestionario, rutina, asistente, texto, plan, version) on public.opiniones to authenticated;
drop policy if exists "cada usuaria envía sus opiniones" on public.opiniones;
create policy "cada usuaria envía sus opiniones" on public.opiniones
  for insert to authenticated with check (user_id = auth.uid());
grant select, insert, update on public.invitaciones, public.canjes, public.opiniones to service_role;
