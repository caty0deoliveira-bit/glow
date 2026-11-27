# Fase 2: cuentas y pagos

## Cómo funciona
1. Al tocar «Elegir plan», la app crea un acceso anónimo en Supabase para ese móvil (sin email ni contraseña) y abre el enlace de pago de Stripe con `client_reference_id` = id de ese acceso.
2. Stripe cobra y avisa a la función `stripe-webhook` (evento `checkout.session.completed`). La función comprueba la firma y guarda plan, estado, email y cliente en `suscripciones`.
3. Stripe devuelve a la usuaria a `https://caty0deoliveira-bit.github.io/glow/?pago=esencial` (o `caty`). La app lee su plan (solo puede ver sus propias filas, por RLS) y desbloquea la rutina.
4. Cambios y bajas (`customer.subscription.updated` / `deleted`) actualizan el estado. Cuenta como pagado: `active`, `trialing` y `past_due`.
5. Para cancelar: Ajustes → «Gestionar o cancelar mi suscripción» abre el portal de Stripe (entra con su email).

## Datos
- Supabase: proyecto `glow` (`pzucpyzggotcedvpghli`), Frankfurt. Clave pública en `index.html` (segura con RLS).
- Enlaces de pago: Glow Esencial `plink_1Ug2IuLoa4hwHC4QM3oZySim` (Managed Payments), Glow con Caty `plink_1Ug2WlLoa4hwHC4QJ9xHVyQC` (Stripe normal).
- Destino de webhook en Stripe: «Glow app (Supabase)», `we_1UgKeFLoa4hwHC4QnSCI8Qgz`.
- Portal: https://billing.stripe.com/p/login/00weVe96SbsU6nR2gx53O00
- Secreto `STRIPE_WEBHOOK_SECRET`: lo pega Caty en Supabase → Edge Functions → Secrets. Nunca en el repo.

## Si una usuaria cambia de móvil (hasta que exista el panel de la Fase 3)
Ella te manda su código (Ajustes → «Ver mi código») y el email con el que pagó. En Supabase → SQL Editor:

```sql
update public.suscripciones set user_id = 'CÓDIGO-DEL-MÓVIL-NUEVO' where email = 'email@con-el-que-pago.com';
```

Luego ella toca «Ya pagué: actualizar mi plan».

## Invitaciones de prueba (amigas testers)
- Enlace: `https://caty0deoliveira-bit.github.io/glow/?invitacion=CÓDIGO`. Cada persona recibe Glow Esencial gratis 7 días desde que lo abre. El código tiene usos máximos y fecha límite para canjearlo (tabla `invitaciones`).
- Al caducar, la fila deja de verse por RLS y la rutina vuelve a bloquearse.
- Las testers ven «Estás probando Glow» y un formulario de opinión. Las opiniones llegan a la tabla `opiniones` (Supabase → Table Editor → opiniones).
- Crear otra invitación (SQL Editor):
  `insert into public.invitaciones (codigo, dias, usos_max, caduca, nota) values ('NUEVO-CODIGO', 7, 10, now() + interval '7 days', 'nota');`
- Ver cuántas personas la usaron: `select codigo, usos, usos_max, caduca from public.invitaciones;`
