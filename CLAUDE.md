# Glow by Caty: instrucciones para Claude Code

Este archivo es la memoria del proyecto. Léelo entero antes de escribir código y vuelve a él cuando dudes.

## Quién es la clienta y cómo trabajar con ella

- **Caty De Oliveira**, farmacéutica especialista en dermocosmética y creadora de contenido (@caty.skincare). Su público son sobre todo mujeres de 40 años o más, en España y Latinoamérica.
- **Caty no es desarrolladora.** Háblale en español, en frases cortas y sin jerga. Cuando necesites que haga algo (crear una cuenta, pegar una clave, aprobar un permiso), dile exactamente qué pantalla abrir, qué botón pulsar y qué copiar, paso a paso.
- Pídele solo lo imprescindible. Todo lo que puedas hacer tú, hazlo tú.
- Al terminar cada fase, publica la app y dale un enlace para que la pruebe en su móvil antes de seguir.
- Nunca le pidas que pegue contraseñas, claves secretas ni datos bancarios en el chat. Las claves las pega ella directamente en el panel del servicio que corresponda (Supabase, GitHub), y tú le dices dónde.

## Qué es Glow

Una app web para móvil (PWA) que hace un diagnóstico orientativo de la piel y da una rutina de skincare personalizada, con productos de afiliada y seguimiento.

- **Gratis:** cuestionario, perfil Baumann, fotos y simulación orientativa.
- **Glow Esencial (10 €/mes):** rutina de mañana y noche, 2 productos por paso, asistente de seguimiento a los 2 días.
- **Glow con Caty (15 €/mes):** todo lo anterior más chat con Caty (respuesta en menos de 48 h, hasta 10 mensajes al mes).
- La sesión 1 a 1 de 50 € quedó **fuera del piloto**. No la implementes.

## Fuente de verdad

1. `prototipo/glow-prototipo.html`: prototipo navegable aprobado por Caty. Diseño, textos, flujo y la lógica del motor de rutina (función `plan()`) salen de aquí. Ábrelo y respétalo.
2. `datos/catalogo.json`: productos aprobados, enlaces y reglas de selección.
3. `datos/cuestionario.json`: preguntas, secciones y cálculo Baumann.
4. `datos/evidencia.json`: referencias de PubMed que respaldan cada recomendación.
5. `datos/config.json`: marca, afiliados, planes, enlaces de pago de Stripe, GitHub.
6. `docs/especificacion.md`: especificación funcional y técnica completa, con las fases.

Si algo en la especificación contradice al prototipo en un texto o una recomendación de salud, manda el prototipo y avisa a Caty.

## Reglas que no se rompen

- **Nada de contenido de salud inventado.** No añadas, quites ni cambies recomendaciones, activos, advertencias o afirmaciones sobre la piel sin que Caty lo apruebe y sin una referencia de PubMed. Si ves algo que parece incorrecto, pregúntale; no lo corrijas por tu cuenta.
- **Marcas excluidas:** Freshly Cosmetics y Cocunat nunca se recomiendan ni se añaden al catálogo (Caty rechaza el marketing del miedo «clean»). Mantén el filtro en código aunque no estén en el catálogo.
- **Retinoides:** nunca mostrar productos con `contiene_retinoide: true` a quien marque embarazo o lactancia, ni en el paso de noches sin retinoide.
- **Precios:** no mostrar precios de Amazon (política de Amazon Afiliados). Sí mostrar el aviso de afiliada en la rutina y en Ajustes.
- **Stripe:** Glow Esencial usa Managed Payments. **Glow con Caty nunca usa Managed Payments**, porque incluye atención humana y Stripe no lo admite. No crees ni cambies productos, precios ni enlaces de pago sin decírselo antes a Caty.
- **Privacidad (RGPD, datos de salud):** las fotos, el cuestionario y la rutina se guardan **solo en el dispositivo**. En el servidor solo: email, plan, estado de la suscripción, datos mínimos del seguimiento y, si la usuaria lo acepta expresamente, el resumen de su perfil y los mensajes del chat con Caty. Nada de analítica ni cookies de terceros. Excepción aprobada por Caty (27/11/2026): un contador anónimo propio (`eventos_uso` en Supabase) que solo registra pasos de la app con un id aleatorio del móvil; nunca respuestas, fotos ni datos de salud.
- **Secretos:** ninguna clave secreta en el repositorio ni en el código del navegador. Usa los secretos de Supabase y de GitHub. Revisa antes de cada commit.
- **Avisos que no se quitan:** «Glow es una guía cosmética orientativa y no sustituye la consulta con un dermatólogo», el aviso de que la simulación es ilustrativa y el aviso de que el perfil Baumann es orientativo y no es el test oficial.
- **Idioma:** español latinoamericano neutro, cálido y directo. A la usuaria se le habla de tú; en plural, «ustedes» (nunca «vosotros»). Frases cortas, sin tono corporativo.

## Arquitectura elegida (piloto, coste cero salvo comisiones de Stripe)

- **App:** PWA estática publicada en GitHub Pages, repo `caty0deoliveira-bit/glow`, URL `https://caty0deoliveira-bit.github.io/glow/`. Debe funcionar sin conexión (service worker) para todo lo que no necesita servidor.
- **Servidor:** Supabase (plan gratuito, región de la UE). Login por enlace mágico al email, base de datos con seguridad por filas (RLS) y Edge Functions para el webhook de Stripe, el portal de cliente, el aviso de seguimiento y el borrado de cuenta.
- **Pagos:** los enlaces de pago de Stripe ya creados (ver `config.json`), abiertos con `client_reference_id` (id de la usuaria en Supabase) y `prefilled_email`. Un webhook de Stripe actualiza el plan. Cancelación desde el portal de cliente de Stripe.
- **Avisos del asistente:** Web Push (claves VAPID) lanzado por una tarea programada de Supabase. En iPhone solo funciona con la app instalada en la pantalla de inicio: explícalo en la app.
- **Panel de Caty:** `admin.html`, acceso por enlace al correo. La administradora es la primera cuenta con email verificado (`reclamar_admin`), guardada por id en `config_privada`: ningún email en el código, porque el repo es público.

Puedes elegir la herramienta de construcción (por ejemplo Vite con JavaScript o TypeScript sin framework pesado), siempre que el resultado sea ligero, funcione sin conexión y se publique en GitHub Pages.

## Cómo trabajar

- Sigue las fases de `docs/especificacion.md` en orden. No empieces una fase sin que Caty haya probado y aprobado la anterior.
- Haz commits pequeños con mensajes claros en español.
- Escribe pruebas para el motor de rutina (casos de la especificación) y para la selección de productos. Deben pasar antes de cada publicación.
- Al final de cada fase: publica, comprueba la app en tamaño móvil, dale a Caty el enlace y una lista corta de qué probar.
- Mantén una lista de pendientes en `docs/pendientes.md` y actualízala.
