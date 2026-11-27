# Pendientes

## Fase 1 (publicada, en prueba)
- [x] App PWA con cuestionario, perfil Baumann, fotos, simulación, rutina y asistente a los 2 días.
- [x] Funciona sin conexión y permite borrar todos los datos.
- [x] Las 7 pruebas del motor pasan.
- [x] Caty probó y aprobó (27/11/2026).

## Fase 2 (terminada y probada)
- [x] Supabase «glow» (organización «Glow by Caty», plan gratuito, Frankfurt), acceso anónimo activado.
- [x] Decisión de Caty: sin login por email en el piloto. El acceso queda en el móvil; si cambia de móvil, Caty lo pasa (ver `docs/fase2.md`).
- [x] Tablas `suscripciones` y `eventos_stripe` con RLS (`supabase/migrations/001_suscripciones.sql`).
- [x] Función `stripe-webhook` desplegada, sin JWT, con verificación de firma (pruebas en `tests/webhook.test.mjs`).
- [x] Stripe: destino de webhook «Glow app (Supabase)» con 3 eventos, redirección tras el pago en los dos enlaces, portal de clientes activado.
- [x] App: pagos reales, bloqueo de rutina y mensajes, portal, «Ya pagué», código para cambiar de móvil.
- [x] Caty pegó el secreto de firma del webhook en Supabase (`STRIPE_WEBHOOK_SECRET`).
- [x] Compra real de Caty (27/11): alta registrada y rutina desbloqueada; reembolsada y cancelada, y la baja llegó al servidor.
- [ ] Más adelante: captcha para el acceso anónimo si hay abuso.

## Prueba con 10 amigas (27/11 a 4/12)
- [x] Enlace de invitación: 7 días de Glow Esencial, 10 usos, canjeable hasta el 4/12.
- [x] Formulario de opinión en la app (tabla `opiniones`).
- [ ] Leer las opiniones y decidir mejoras con Caty.

## Fase 3 (publicada, pendiente de prueba con Caty)
- [x] Chat con Caty con límite de 10 al mes y perfil compartido con consentimiento.
- [x] Avisos push: asistente a los 2 días, respuesta de Caty y mensaje nuevo para Caty.
- [x] Panel `admin.html`: mensajes, uso, opiniones, invitaciones, suscripciones y pasar acceso.
- [x] Contador anónimo de uso (`eventos_uso`).
- [ ] Caty entra en su panel por primera vez (queda como administradora).
- [ ] Caty activa los avisos en su móvil y prueba una conversación.

## Fases siguientes (solo tras aprobar la anterior)
- Fase 4: textos legales (borrador para revisar con abogada).

## Lo que tiene que hacer Caty
- Añadir `https://caty0deoliveira-bit.github.io/glow/` como sitio web en Amazon Afiliados España y EE. UU.
- Confirmar en el panel de YesStyle que las compras con `?rco=CATYSKIN1` se atribuyen.
- Conseguir con SiteStripe los ASIN de EE. UU. que faltan (ahora usan búsqueda).
- Datos legales para el aviso legal y la privacidad; revisión por abogada.
- Consultar con su gestoría el IVA del plan Glow con Caty (15 €, Stripe normal).
