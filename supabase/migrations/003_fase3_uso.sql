-- Glow by Caty · Fase 3 (chat, avisos, panel de Caty) y contador anónimo de uso
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------- Quién es Caty (administradora) ----------
-- La administradora es la primera cuenta con email verificado que reclama el panel (reclamar_admin).
-- Mientras Supabase use su correo por defecto, solo el equipo del proyecto (Caty) puede verificar un email.
-- Su id se guarda en config_privada; ningún email queda escrito en el código.
create table if not exists public.config_privada (clave text primary key, valor text not null);
alter table public.config_privada enable row level security;
revoke all on public.config_privada from anon, authenticated;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
     and exists (select 1 from public.config_privada c where c.clave = 'admin_id' and c.valor = auth.uid()::text)
$$;
create or replace function public.reclamar_admin() returns boolean
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then return false; end if;
  if exists (select 1 from public.config_privada where clave = 'admin_id') then return public.es_admin(); end if;
  if not exists (select 1 from auth.users u where u.id = uid and u.email_confirmed_at is not null and not coalesce(u.is_anonymous, false)) then return false; end if;
  insert into public.config_privada (clave, valor) values ('admin_id', uid::text) on conflict do nothing;
  return public.es_admin();
end $$;
revoke execute on function public.reclamar_admin() from public, anon;
grant execute on function public.reclamar_admin() to authenticated;
grant execute on function public.es_admin() to authenticated;

-- ---------- Contador anónimo de uso ----------
-- Solo pasos de la app. Nunca respuestas del cuestionario, fotos ni datos de piel o salud.
create table if not exists public.eventos_uso (
  id      bigint generated always as identity primary key,
  creado  timestamptz not null default now(),
  disp    text not null check (char_length(disp) <= 40),          -- id aleatorio del móvil, no ligado a la cuenta
  evento  text not null check (evento ~ '^[a-z_]{2,40}$'),
  dato    text check (char_length(dato) <= 60),
  plan    text check (plan in ('free','esencial','caty')),
  prueba  boolean not null default false,                           -- amiga con invitación
  version text check (char_length(version) <= 12)
);
create index if not exists eventos_uso_creado_idx on public.eventos_uso(creado);
alter table public.eventos_uso enable row level security;
revoke all on public.eventos_uso from anon, authenticated;
grant insert (disp, evento, dato, plan, prueba, version) on public.eventos_uso to anon, authenticated;
drop policy if exists "cualquiera registra uso" on public.eventos_uso;
create policy "cualquiera registra uso" on public.eventos_uso for insert to anon, authenticated with check (true);

create or replace function public.resumen_uso(p_dias int default 30, p_solo_prueba boolean default false)
returns table(evento text, dato text, personas bigint, veces bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  return query select e.evento, e.dato, count(distinct e.disp), count(*)
    from public.eventos_uso e
    where e.creado > now() - make_interval(days => p_dias) and (not p_solo_prueba or e.prueba)
    group by 1, 2;
end $$;
create or replace function public.uso_diario(p_dias int default 30, p_solo_prueba boolean default false)
returns table(dia date, personas bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  return query select (e.creado at time zone 'Europe/Madrid')::date, count(distinct e.disp)
    from public.eventos_uso e
    where e.creado > now() - make_interval(days => p_dias) and (not p_solo_prueba or e.prueba)
    group by 1 order by 1;
end $$;
revoke execute on function public.resumen_uso(int, boolean), public.uso_diario(int, boolean) from public, anon;
grant execute on function public.resumen_uso(int, boolean), public.uso_diario(int, boolean) to authenticated;

-- ---------- Chat con Caty ----------
create table if not exists public.mensajes (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  de      text not null check (de in ('usuaria','caty')),
  texto   text not null check (char_length(texto) between 1 and 2000),
  creado  timestamptz not null default now(),
  leido   boolean not null default false,
  avisado boolean not null default false
);
create index if not exists mensajes_user_idx on public.mensajes(user_id, creado);
alter table public.mensajes enable row level security;
revoke all on public.mensajes from anon, authenticated;
grant select (id, user_id, de, texto, creado, leido) on public.mensajes to authenticated;
drop policy if exists "ver mis mensajes o todos si soy Caty" on public.mensajes;
create policy "ver mis mensajes o todos si soy Caty" on public.mensajes
  for select to authenticated using (auth.uid() = user_id or public.es_admin());

create or replace function public.tiene_plan_caty(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.suscripciones s where s.user_id = p_user and s.plan = 'caty'
    and s.estado in ('active','trialing','past_due') and (s.vence is null or s.vence > now()))
$$;

create or replace function public.mensajes_este_mes(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.mensajes m where m.user_id = p_user and m.de = 'usuaria'
    and date_trunc('month', m.creado at time zone 'Europe/Madrid') = date_trunc('month', now() at time zone 'Europe/Madrid')
$$;

create or replace function public.enviar_mensaje(p_texto text) returns bigint
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); nid bigint;
begin
  if uid is null then raise exception 'sin_sesion'; end if;
  if not public.tiene_plan_caty(uid) then raise exception 'sin_plan_caty'; end if;
  if public.mensajes_este_mes(uid) >= 10 then raise exception 'limite_mes'; end if;
  insert into public.mensajes (user_id, de, texto) values (uid, 'usuaria', trim(p_texto)) returning id into nid;
  return nid;
end $$;

create or replace function public.responder_mensaje(p_user uuid, p_texto text) returns bigint
language plpgsql security definer set search_path = public as $$
declare nid bigint;
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  insert into public.mensajes (user_id, de, texto) values (p_user, 'caty', trim(p_texto)) returning id into nid;
  update public.mensajes set leido = true where user_id = p_user and de = 'usuaria' and not leido;
  return nid;
end $$;

create or replace function public.marcar_leidos(p_user uuid default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_user is not null and public.es_admin() then
    update public.mensajes set leido = true where user_id = p_user and de = 'usuaria' and not leido;
  else
    update public.mensajes set leido = true where user_id = auth.uid() and de = 'caty' and not leido;
  end if;
end $$;

-- Perfil que la usuaria decide compartir con Caty (consentimiento expreso; lo puede borrar)
create table if not exists public.perfiles (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  alias       text check (char_length(alias) <= 40),
  resumen     jsonb,
  actualizado timestamptz not null default now()
);
alter table public.perfiles enable row level security;
revoke all on public.perfiles from anon, authenticated;
grant select, insert, update, delete on public.perfiles to authenticated;
drop policy if exists "mi perfil o todos si soy Caty" on public.perfiles;
create policy "mi perfil o todos si soy Caty" on public.perfiles for select to authenticated using (auth.uid() = user_id or public.es_admin());
drop policy if exists "guardo mi perfil" on public.perfiles;
create policy "guardo mi perfil" on public.perfiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "actualizo mi perfil" on public.perfiles;
create policy "actualizo mi perfil" on public.perfiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "borro mi perfil" on public.perfiles;
create policy "borro mi perfil" on public.perfiles for delete to authenticated using (auth.uid() = user_id);

-- ---------- Avisos push ----------
create table if not exists public.avisos_push (
  endpoint    text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  p256dh      text not null,
  auth        text not null,
  es_admin    boolean not null default false,
  bot_en      timestamptz,
  bot_enviado boolean not null default false,
  creado      timestamptz not null default now()
);
alter table public.avisos_push enable row level security;
revoke all on public.avisos_push from anon, authenticated;

create or replace function public.guardar_aviso(p_endpoint text, p_p256dh text, p_auth text, p_bot_en timestamptz default null) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sin_sesion'; end if;
  insert into public.avisos_push (endpoint, user_id, p256dh, auth, es_admin, bot_en)
    values (p_endpoint, uid, p_p256dh, p_auth, public.es_admin(), p_bot_en)
  on conflict (endpoint) do update set user_id = uid, p256dh = excluded.p256dh, auth = excluded.auth,
    es_admin = public.es_admin(), bot_en = coalesce(excluded.bot_en, public.avisos_push.bot_en);
end $$;
create or replace function public.borrar_aviso(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from public.avisos_push where endpoint = p_endpoint and user_id = auth.uid()
$$;
create or replace function public.bot_visto() returns void
language sql security definer set search_path = public as $$
  update public.avisos_push set bot_enviado = true where user_id = auth.uid()
$$;

-- Claves VAPID: las genera la función «avisos» y se guardan en config_privada (solo las lee el servidor)

-- ---------- Panel de Caty ----------
create or replace function public.conversaciones()
returns table(user_id uuid, alias text, email text, plan text, ultimo timestamptz, ultimo_texto text, ultimo_de text, sin_leer bigint, este_mes int, comparte_perfil boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  return query
  with ult as (select distinct on (m.user_id) m.user_id, m.creado, m.texto, m.de from public.mensajes m order by m.user_id, m.creado desc)
  select u.user_id, p.alias,
    (select s.email from public.suscripciones s where s.user_id = u.user_id and s.email is not null order by s.creado desc limit 1),
    (select s.plan from public.suscripciones s where s.user_id = u.user_id and s.estado in ('active','trialing','past_due') and (s.vence is null or s.vence > now()) order by (s.plan = 'caty') desc limit 1),
    u.creado, u.texto, u.de,
    (select count(*) from public.mensajes m where m.user_id = u.user_id and m.de = 'usuaria' and not m.leido),
    public.mensajes_este_mes(u.user_id), p.user_id is not null
  from ult u left join public.perfiles p on p.user_id = u.user_id
  order by u.creado desc;
end $$;

create or replace function public.lista_suscripciones()
returns table(email text, plan text, estado text, origen text, vence timestamptz, creado timestamptz, con_movil boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  return query select s.email, s.plan, s.estado, s.origen, s.vence, s.creado, s.user_id is not null
    from public.suscripciones s order by s.creado desc;
end $$;

create or replace function public.pasar_acceso(p_email text, p_codigo uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  if not exists (select 1 from auth.users where id = p_codigo) then raise exception 'codigo_no_existe'; end if;
  update public.suscripciones set user_id = p_codigo, actualizado = now()
    where lower(email) = lower(trim(p_email)) and origen = 'stripe';
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.lista_invitaciones()
returns table(codigo text, plan text, dias int, usos int, usos_max int, caduca timestamptz, nota text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  return query select i.codigo, i.plan, i.dias, i.usos, i.usos_max, i.caduca, i.nota from public.invitaciones i order by i.creado desc;
end $$;

create or replace function public.crear_invitacion(p_codigo text, p_dias int, p_usos int, p_caduca timestamptz, p_nota text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  insert into public.invitaciones (codigo, plan, dias, usos_max, caduca, nota)
    values (upper(trim(p_codigo)), 'esencial', greatest(1, least(p_dias, 60)), greatest(1, least(p_usos, 500)), p_caduca, p_nota);
end $$;

-- Caty lee las opiniones
grant select on public.opiniones to authenticated;
drop policy if exists "Caty lee las opiniones" on public.opiniones;
create policy "Caty lee las opiniones" on public.opiniones for select to authenticated using (public.es_admin());

-- Permisos de las funciones
revoke execute on function public.tiene_plan_caty(uuid), public.mensajes_este_mes(uuid) from public, anon;
revoke execute on function public.enviar_mensaje(text), public.responder_mensaje(uuid, text), public.marcar_leidos(uuid),
  public.guardar_aviso(text, text, text, timestamptz), public.borrar_aviso(text), public.bot_visto(),
  public.conversaciones(), public.lista_suscripciones(), public.pasar_acceso(text, uuid),
  public.lista_invitaciones(), public.crear_invitacion(text, int, int, timestamptz, text) from public, anon;
grant execute on function public.tiene_plan_caty(uuid), public.mensajes_este_mes(uuid), public.enviar_mensaje(text), public.responder_mensaje(uuid, text), public.marcar_leidos(uuid),
  public.guardar_aviso(text, text, text, timestamptz), public.borrar_aviso(text), public.bot_visto(),
  public.conversaciones(), public.lista_suscripciones(), public.pasar_acceso(text, uuid),
  public.lista_invitaciones(), public.crear_invitacion(text, int, int, timestamptz, text) to authenticated;

-- El servidor (función avisos)
grant select, insert, update, delete on public.avisos_push, public.config_privada to service_role;
grant select, update on public.mensajes to service_role;

-- ---------- Avisos automáticos ----------
-- Cada mensaje nuevo avisa (a Caty o a la usuaria) a través de la función «avisos»
create or replace function public.avisar_mensaje() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://pzucpyzggotcedvpghli.supabase.co/functions/v1/avisos',
    body := jsonb_build_object('mensaje', new.id),
    headers := '{"Content-Type":"application/json"}'::jsonb);
  return new;
end $$;
drop trigger if exists mensajes_avisar on public.mensajes;
create trigger mensajes_avisar after insert on public.mensajes for each row execute function public.avisar_mensaje();

-- Cada 15 minutos: avisos del asistente que ya tocan (2 días después de ver la rutina)
select cron.unschedule('glow-avisos-asistente') where exists (select 1 from cron.job where jobname = 'glow-avisos-asistente');
select cron.schedule('glow-avisos-asistente', '*/15 * * * *', $$
  select net.http_post(url := 'https://pzucpyzggotcedvpghli.supabase.co/functions/v1/avisos',
    body := '{"tipo":"asistente"}'::jsonb, headers := '{"Content-Type":"application/json"}'::jsonb);
$$);
