-- 004 · Contactos con consentimiento y borrado de datos del servidor (28/11/2026, pedido por Caty)
-- Contactos: solo si la usuaria deja su email y marca el consentimiento. Se guarda el email, un nombre opcional
-- y hasta qué paso de la app llegó (terminó el cuestionario, vio los planes, fue a pagar, pagó).
-- Nunca respuestas del cuestionario, fotos ni datos de piel o salud.

create table if not exists public.contactos (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text not null check (char_length(email) <= 120 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nombre      text check (char_length(nombre) <= 60),
  consiente   boolean not null check (consiente),
  texto_consentimiento text not null check (char_length(texto_consentimiento) <= 400),
  creado      timestamptz not null default now(),
  paso        text check (paso in ('inicio','cuestionario_fin','planes','pago_inicio','pago_ok')),
  paso_fecha  timestamptz
);
alter table public.contactos enable row level security;
revoke all on public.contactos from anon, authenticated;

create or replace function public.paso_orden(p text) returns int language sql immutable as $$
  select case p when 'inicio' then 0 when 'cuestionario_fin' then 1 when 'planes' then 2 when 'pago_inicio' then 3 when 'pago_ok' then 4 else -1 end $$;

create or replace function public.guardar_contacto(p_email text, p_nombre text, p_texto text, p_paso text default 'inicio') returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sin_sesion'; end if;
  insert into public.contactos(user_id, email, nombre, consiente, texto_consentimiento, paso, paso_fecha)
  values (uid, lower(trim(p_email)), nullif(trim(p_nombre), ''), true, p_texto, coalesce(p_paso, 'inicio'), now())
  on conflict (user_id) do update set email = excluded.email, nombre = excluded.nombre,
    consiente = true, texto_consentimiento = excluded.texto_consentimiento, creado = now(),
    paso = case when public.paso_orden(excluded.paso) > public.paso_orden(public.contactos.paso) then excluded.paso else public.contactos.paso end;
end $$;

create or replace function public.contacto_paso(p_paso text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.contactos set paso = p_paso, paso_fecha = now()
   where user_id = auth.uid() and public.paso_orden(p_paso) > public.paso_orden(paso);
end $$;

create or replace function public.mi_contacto() returns table(email text, nombre text)
language sql stable security definer set search_path = public as $$
  select c.email, c.nombre from public.contactos c where c.user_id = auth.uid() $$;

create or replace function public.borrar_contacto() returns void
language sql security definer set search_path = public as $$
  delete from public.contactos where user_id = auth.uid() $$;

-- Borra todo lo que la usuaria tiene en el servidor salvo el registro de su suscripción de pago,
-- que se conserva por obligación legal (facturación) y para que Stripe pueda seguir avisando de bajas.
create or replace function public.borrar_mis_datos() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  delete from public.contactos where user_id = uid;
  delete from public.perfiles where user_id = uid;
  delete from public.mensajes where user_id = uid;
  delete from public.avisos_push where user_id = uid;
end $$;

create or replace function public.lista_contactos()
returns table(email text, nombre text, creado timestamptz, paso text, paso_fecha timestamptz, plan text, prueba boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'solo_admin'; end if;
  return query select c.email, c.nombre, c.creado, c.paso, c.paso_fecha,
    (select s.plan from public.suscripciones s where s.user_id = c.user_id and s.estado in ('active','trialing','past_due')
       and (s.vence is null or s.vence > now()) order by (s.plan = 'caty') desc limit 1),
    exists(select 1 from public.suscripciones s where s.user_id = c.user_id and s.origen like 'invitacion%')
    from public.contactos c order by c.creado desc;
end $$;

revoke execute on function public.guardar_contacto(text, text, text, text), public.contacto_paso(text), public.mi_contacto(),
  public.borrar_contacto(), public.borrar_mis_datos(), public.lista_contactos() from public, anon;
grant execute on function public.guardar_contacto(text, text, text, text), public.contacto_paso(text), public.mi_contacto(),
  public.borrar_contacto(), public.borrar_mis_datos(), public.lista_contactos() to authenticated;

