# Fase 3: chat con Caty, avisos, panel y contador de uso

## Panel de Caty
- `https://caty0deoliveira-bit.github.io/glow/admin.html`. Se entra con un enlace que llega al email.
- La primera cuenta con email verificado que entra queda como administradora (`reclamar_admin` guarda su id en `config_privada`). Con el correo por defecto de Supabase solo pueden verificar email los miembros del equipo del proyecto, es decir, Caty.
- Pestañas: Mensajes (responder y ver el perfil compartido), Uso (contador anónimo), Opiniones, Invitaciones (crear y copiar enlaces) y Suscripciones (lista y «pasar el acceso a otro móvil»).
- «Avisos en este dispositivo»: Caty recibe un aviso cuando alguien le escribe.

## Chat (solo Glow con Caty)
- Tabla `mensajes` con RLS. La usuaria envía con `enviar_mensaje` (exige plan caty activo y máximo 10 al mes, mes de Madrid). Caty responde con `responder_mensaje`.
- Antes del primer mensaje, la app pide consentimiento para compartir el perfil (tabla `perfiles`). Se puede retirar en Ajustes. Las fotos nunca se comparten.

## Avisos push
- Función `avisos` (sin JWT). GET devuelve la clave pública VAPID. Las claves se generan solas la primera vez y se guardan en `config_privada`.
- Disparador `mensajes_avisar`: cada mensaje nuevo llama a la función, que avisa a Caty o a la usuaria (una sola vez por mensaje).
- Tarea `glow-avisos-asistente` (pg_cron, cada 15 min): avisa del asistente a los 2 días de ver la rutina, solo si el plan sigue activo.
- En iPhone los avisos solo funcionan con Glow instalada en la pantalla de inicio (iOS 16.4 o posterior).

## Contador anónimo de uso
- Tabla `eventos_uso`: `disp` (id aleatorio del móvil, no ligado a la cuenta), `evento`, `dato`, `plan`, `prueba`, `version`. Solo se puede insertar; lo lee Caty con `resumen_uso` y `uso_diario`.
- Eventos: abrir, cuestionario_inicio, seccion (n.º), cuestionario_fin, ejemplo, foto, simulacion, pestana, rutina_vista, rutina_bloqueada, comprar (paso:tienda:opción), conseguido, codigo_ys, asistente_inicio, asistente_resp, planes, pago_inicio, pago_ok, portal, invitacion, opinion_abierta, opinion_enviada, perfil_compartido, chat_enviado, avisos_si, avisos_no, aviso_abierto, editar_respuestas, borrado, instalada.
- Nunca: respuestas del cuestionario, fotos, tipo de piel, textos del chat ni datos de salud (hay una prueba automática que lo comprueba).
