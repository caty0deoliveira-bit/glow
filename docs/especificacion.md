# Glow by Caty: especificación

Versión aprobada por Caty el 26 de noviembre de 2026. El prototipo `prototipo/glow-prototipo.html` muestra cada pantalla; esta especificación explica cómo pasarlo a producción.

## 1. Pantallas y flujo

Todas las pantallas llevan la marca «Glow by Caty». El menú «Pantallas» y la pantalla «Catálogo para aprobar» del prototipo son herramientas de revisión: **no van en la app final**. Los botones marcados «Prototipo:» tampoco.

1. **Bienvenida:** logo, «Glow by Caty De Oliveira», tarjeta «Creada por Caty» (farmacéutica especialista en dermocosmética y autora de *Manual de Skincare para mujeres 40+*), datos rápidos (gratis, unos 5 minutos, privado) y botones «Empezar gratis» y «Ver un ejemplo completo».
2. **Cuestionario:** 9 secciones y 28 preguntas de `datos/cuestionario.json`, una por pantalla, con barra de progreso y botón Atrás. Las respuestas de opción única avanzan solas. Las múltiples respetan `max` y la opción exclusiva `none` («Ninguna», «Nada todavía»…).
3. **Fotos:** frontal y dos perfiles, con consejos de luz. Se redimensionan a 900 px como máximo y se guardan solo en el dispositivo (IndexedDB).
4. **Mi piel (gratis):** código Baumann de 4 letras con barras por eje y explicación de cada letra, «Hoy y tu objetivo», contexto (edad, país, etapa, fototipo, condiciones, dermatólogo) y las 3 primeras alertas. Si la usuaria no ha pagado, tarjeta «Tu rutina ya está lista» con el número de pasos y productos.
5. **Simular (gratis):** selector de foto, comparador «Hoy / Tu objetivo» arrastrable, intensidad suave, media o marcada, y análisis visual orientativo (uniformidad, luminosidad, rojeces, textura). Mantén el filtro y los avisos del prototipo.
6. **Rutina (de pago):** sin plan, pantalla bloqueada con resumen y planes. Con plan: firma de Caty, mañana y noche paso a paso (qué, por qué y «Ver estudio»), 2 productos por paso con botón Comprar, chip de código YesStyle, «Marcar como conseguido», plan de introducción del retinoide, notas por tipo de cosmética, alertas y aviso de afiliada.
7. **Mensajes (de pago):** pestaña «Asistente» (seguimiento) y pestaña «Caty» (chat, solo en Glow con Caty; en Esencial, invitación a subir de plan).
8. **Ajustes:** plan actual (cambiar o cancelar en el portal de Stripe), revisar respuestas, gestionar fotos, «La ciencia detrás de tu rutina» (lista de `evidencia.json`), compartir mi perfil con Caty (solo en Glow con Caty), cerrar sesión, borrar todos mis datos, instalar Glow, aviso de afiliada y aviso médico.

Pestañas inferiores: Mi piel, Simular, Rutina, Mensajes, Ajustes.

## 2. Motor de rutina

Porta la función `plan()` del prototipo **tal cual**, junto con `axes()`, `picks()` y `link()`. Es la lógica aprobada clínicamente. Lo que hace:

- **Baumann:** cada eje suma 2 preguntas (0 a 2 cada una). Si la suma es mayor que 2, letra alta (O, S, P, W); si no, letra baja (D, R, N, T). Una suma de exactamente 2 se marca «en el límite».
- **Flags:** embarazo o lactancia, perimenopausia o menopausia, isotretinoína, retinoide recetado, rosácea, sensibilidad (eje S, rosácea o dermatitis atópica), melasma, manchas, envejecimiento, granitos, piel grasa, rutina mínima (3 pasos), medicamentos fotosensibilizantes, sin perfume, fototipo IV a VI.
- **Mañana:** limpieza, sérum (vitamina C, antioxidante suave, niacinamida o sérum de ceramidas o ectoína, según el caso), hidratante y protector solar (con color si hay manchas y además fototipo alto o melasma).
- **Noche:** limpieza (doble salvo rutina mínima), tratamiento (nunca retinoide con embarazo, lactancia, isotretinoína, retinoide recetado o rosácea), noches sin retinoide si aplica, contorno si eligió 6 o más pasos y tiene ojeras, e hidratante.
- **Retinoide:** plan de introducción de 4 etapas, de 2 noches por semana a cada noche.
- **Alertas:** dermatólogo hace más de 3 años o nunca, acné moderado o severo, embarazo, isotretinoína, fotosensibilidad, fototipo alto con manchas, sin protector, tabaco, poco sueño y lunares (siempre).

**Selección de productos (`picks`):**
- Productos del paso según su categoría del catálogo, quitando las marcas excluidas y, si aplica, los que llevan retinoide.
- Puntuación: −10 si superan el nivel máximo del presupuesto, +3 por cada preferencia de cosmética que coincida, −0,8 por cada nivel de distancia, −4 si no hay enlace directo para su país y −3 si lleva perfume y pidió sin perfume.
- Se elige la mejor y, como segunda, la mejor de otra tienda que no puntúe más de 4 por debajo; si no hay, la siguiente.

**Pruebas obligatorias (como mínimo):**
1. El perfil de ejemplo (47 años, perimenopausia, DSPW, España, farmacia y coreana, presupuesto moderado, 4 o 5 pasos, sin perfume) da el código DSPW, un retinoide con plan de introducción y noches sin retinoide sin ningún producto con retinoide.
2. Embarazo: ningún producto con `contiene_retinoide`, sin paso de retinoide y con el ácido azelaico como tratamiento.
3. Isotretinoína: sin retinoide ni exfoliantes, con la alerta correspondiente.
4. Usuaria de México: los enlaces de Amazon van a amazon.com con `caterinedeoli-20` y muestran «Envío internacional».
5. Usuaria de España: los enlaces de Amazon van a amazon.es con `caterinedeoli-21`.
6. Ninguna recomendación incluye Freshly Cosmetics ni Cocunat, aunque se añadan al catálogo.
7. Rutina mínima (3 pasos): sin sérum de mañana, con limpieza simple de noche.

## 3. Enlaces de afiliada

- **Amazon:** `https://{dominio}/dp/{ASIN}?tag={tag}` según el país (ver `config.json`). Si falta el ASIN de ese país, `https://{dominio}/s?k={búsqueda}&tag={tag}`, usando `amazon_us_busqueda` si existe, y el aviso «Enlace directo pendiente».
- **YesStyle:** `https://www.yesstyle.com/es/info.html/pid.{pid}?rco=CATYSKIN1` y chip para copiar el código CATYSKIN1.
- Los enlaces se abren en una pestaña nueva con `rel="noopener sponsored"`.

## 4. Cuentas y pagos

- **Login:** enlace mágico de Supabase al email. Solo hace falta cuenta para pagar, para el seguimiento y para el chat. El cuestionario y la parte gratis funcionan sin cuenta.
- **Pagar:** abrir el Payment Link del plan con `?client_reference_id={user_id}&prefilled_email={email}`.
- **Webhook de Stripe** (Edge Function `stripe-webhook`): `checkout.session.completed`, `customer.subscription.updated` y `customer.subscription.deleted` actualizan la tabla de perfiles (plan, estado y `stripe_customer_id`). Verificar siempre la firma.
- **Volver a la app tras pagar:** configurar en cada Payment Link la redirección a `https://caty0deoliveira-bit.github.io/glow/?pago=ok`. La app vuelve a leer el plan desde Supabase; **nunca desbloquea por el parámetro de la URL**.
- **Portal de cliente** (Edge Function `portal`): cambiar de plan y cancelar.
- **Sin conexión:** la app recuerda el último plan verificado y lo vuelve a comprobar cuando hay conexión.
- **Moneda local:** activar en Stripe los precios adaptados a la moneda local si están disponibles para la cuenta. Si no, se cobra en euros y el banco convierte. Pregunta a Caty antes de cambiar precios.

## 5. Asistente de seguimiento

- Al desbloquear la rutina por primera vez se guarda `rutina_entregada_at` en Supabase.
- Una tarea programada cada hora busca a quien cumpla 2 días desde esa fecha y aún no recibió el aviso, envía un Web Push («Asistente de Caty: ¿Pudiste conseguir tus productos?») y lo marca como enviado.
- La conversación ocurre en el dispositivo (pestaña Asistente) con el guion del prototipo (`botReply`): conseguidos todos, algunos o todavía no, qué la frenó (precio, envío, no sé cuál elegir) y si tiene dudas. En Glow con Caty, «Tengo una duda» lleva al chat; en Esencial, a los planes.
- Si la usuaria no tiene la app instalada o no aceptó notificaciones, el asistente aparece igual al abrir la app pasados los 2 días.
- En iPhone, explicar que hay que instalar Glow en la pantalla de inicio para recibir avisos.

## 6. Chat con Caty (solo Glow con Caty)

- Tabla `mensajes` con RLS: cada usuaria ve solo los suyos; Caty (admin) ve todos.
- Límite de 10 mensajes de la usuaria por mes natural, aplicado en el servidor.
- Antes del primer mensaje, consentimiento explícito: «Acepto compartir con Caty el resumen de mi perfil y mi rutina para que pueda responderme», que se puede retirar en Ajustes. Solo se sube el resumen (Baumann, edad, etapa, condiciones, tratamientos, rutina y productos marcados), **nunca las fotos**.
- **Panel `/admin`:** lista de conversaciones, la más antigua sin respuesta primero, con el perfil compartido y un campo de respuesta. Aviso a Caty de mensajes nuevos por Web Push en su móvil.

## 7. Datos y privacidad

- **En el dispositivo:** respuestas, fotos (IndexedDB), rutina y productos marcados.
- **En Supabase (UE):** email, plan, estado, `stripe_customer_id`, `rutina_entregada_at`, aviso enviado, suscripción push, consentimiento, resumen de perfil compartido y mensajes.
- **«Borrar todos mis datos»:** confirmación propia (sin `confirm()`), borra el dispositivo y, si hay cuenta, llama a la Edge Function `borrar-cuenta`, que elimina sus filas y su usuario. Avisar antes de que la suscripción se cancela aparte, en el portal de Stripe, y ofrecer el enlace.
- **Páginas legales:** aviso legal, política de privacidad (datos de salud, art. 9 del RGPD, base: consentimiento explícito), condiciones de uso y suscripción, y política de cookies (solo almacenamiento técnico). Márcalas como **BORRADOR, revisar con un abogado** y pide a Caty sus datos fiscales y su email de contacto para completarlas.

## 8. Diseño

Copia los tokens y estilos del prototipo: marfil, verde topo y marrones, vidrio esmerilado (`backdrop-filter`), tipografía Manrope con su pila de respaldo, modo oscuro, columna máxima de 440 px, zonas de toque de 44 px o más, foco visible y `prefers-reduced-motion`. Icono: `assets/icon-180.png` y `assets/icon-512.png` (puedes rehacerlo en la misma línea si Caty lo pide).

## 9. Fases

**Fase 1: app sin servidor (publicar y probar)**
- Repo `caty0deoliveira-bit/glow` (si existe con una versión antigua, sustitúyela). GitHub Pages activado.
- Cuestionario, Mi piel, Simular, Rutina, Ajustes, catálogo y evidencia desde los JSON, sin conexión y borrado de datos.
- Mientras no haya pagos, la rutina se ve completa para que Caty la pruebe (marcado como modo de prueba).
- Pruebas del motor en verde. QR de la URL pública en `docs/qr-glow.png`.
- Entrega: enlace y QR para que Caty lo pruebe en su móvil.

**Fase 2: cuentas y pagos**
- Proyecto de Supabase: guía a Caty para crear la cuenta gratuita (región UE) y conectarla.
- Login, tablas con RLS, webhook de Stripe, redirecciones de los Payment Links, portal, bloqueo real de la rutina y de Mensajes.
- Clave de Stripe: pide a Caty una **clave restringida** (solo los permisos necesarios) y que la pegue ella en los secretos de Supabase.
- Prueba completa en modo de prueba de Stripe y después una compra real de Caty que ella misma reembolsa.

**Fase 3: asistente y chat**
- Web Push, tarea programada, guion del asistente, chat, consentimiento, límite mensual y panel `/admin`.

**Fase 4: legal y lanzamiento del piloto**
- Páginas legales en borrador, revisión de textos con Caty, comprobación móvil, rendimiento y funcionamiento sin conexión, y QR final.

## 10. Pendientes de Caty (no bloquean la Fase 1)

- **Amazon Afiliados:** añadir la URL de la app como sitio web en sus cuentas de España y de EE. UU.
- **YesStyle:** confirmar en su panel que las ventas con `?rco=CATYSKIN1` se le atribuyen.
- **ASIN de EE. UU. que faltan:** los marca `amazon_us_asin: null` en el catálogo. Caty puede sacarlos con la barra SiteStripe de Amazon EE. UU. cuando quiera, o se quedan con búsqueda.
- **Legal:** datos fiscales, email de contacto y revisión por un abogado.
- **IVA:** Glow con Caty no usa Managed Payments, así que el IVA de ese plan lo declara ella (comentarlo con su gestoría).


## Cambio 27/11/2026: hombres y mujeres
La primera pregunta es `sexo` (Mujer, Hombre, Prefiero no decirlo). Las preguntas pueden llevar `solo_si` (se muestran solo si otra respuesta coincide) y `ocultar_opciones_si` (oculta opciones por índice). A los hombres no se les pregunta la etapa hormonal ni se les muestran terapia hormonal o anticonceptivos, y el motor no usa la etapa hormonal para ellos. No cambia ninguna recomendación de salud.
