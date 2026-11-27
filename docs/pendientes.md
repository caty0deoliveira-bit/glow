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

## Hombres y mujeres (27/11, a partir de las opiniones de las testers)
- [x] Primera pregunta «¿eres mujer u hombre?» (con «Prefiero no decirlo»).
- [x] Hombres: sin etapa hormonal ni terapia hormonal o anticonceptivos; el motor ignora la etapa hormonal.
- [x] Textos neutros («¿Cuántos pasos quieres hacer cada día?», «Te damos la bienvenida»).
- [x] Preguntas de afeitado para hombres, aprobadas por Caty (27/11): «¿Cómo te afeitas?» y «Después de afeitarte, ¿qué te pasa?».
- [x] Rutina: consejo de afeitado (PMID 34254359), paso «Después del afeitado» con sérum de barrera, exfoliante glicólico para pelos enquistados (PMID 8261811; Caty eligió glicólico) y alertas de dermatólogo (PMID 36840647) y de melanoma en hombres de 40+ (PMID 32346751).
- [x] Catálogo: categoría «Ácido glicólico» con The Ordinary Glycolic 7 %, COSRX AHA 7 y Pixi Glow Tonic (lleva perfume), elegidos por Caty.
- [x] Pixi quitado (27/11, a petición de Caty). The Ordinary Glycolic 7 % ya va con su ASIN (B071914GGL).
- [x] La portada mantiene el libro de Caty: es su autoridad (decisión de Caty).

## Catálogo ampliado (27/11, a petición de Caty)
- [x] Limpiadores: Anua Quercetinol (gel), La Roche-Posay Toleriane Crema Limpiadora (suave), heimish All Clean Balm (lleva perfume) y Anua Cleansing Oil Mild (primera limpieza).
- [x] Ceramidas y ectoína: The Ordinary Soothing & Barrier Support y Elizabeth Arden Advanced Ceramide Capsules.
- [x] Hidratantes con ceramidas: Aestura Atobarrier 365, Illiyoon Ceramide Ato y Dr.Jart+ Ceramidin. Ligera: The Ordinary Rice Lipids + Ectoin.
- [x] Protectores: ISDIN Fusion Water Magic, SKIN1004 Hyalu-Cica, Round Lab Birch; con color: ISDIN Fusion Water Magic Color Medium.
- [x] Azelaico coreano: Anua Azelaic Acid 10 y Nineless A-Control 10 %.
- [x] Tranexámico (paso despigmentante): Paula's Choice Discoloration Repair, Anua Niacinamide 10 + TXA 4, Cos De BAHA TT 10.
- [x] Contorno: ISDIN K-Ox Eyes (ojeras, bolsas) y Elizabeth Arden Ceramide Eye (líneas, bolsas). El motor prioriza el contorno según la preocupación.
- [ ] Caty: revisar si ISDIN Fusion Water Magic lleva perfume (no lo pude confirmar) y si le parece bien la niacinamida al 10 % del sérum de Anua con TXA.
- [ ] Caty: decidir si separar «Ojeras o bolsas» en dos opciones y si mostrar el contorno también a quien solo marca líneas finas.
- [ ] Sin ASIN en Amazon España (van por búsqueda): La Roche-Posay Toleriane Crema Limpiadora. Sin ASIN de EE. UU.: ISDIN Fusion Water Magic y Magic Color.
- [ ] Revisar: La Roche-Posay Mela B3 está marcado con retinoide en el catálogo (se oculta en embarazo y en noches sin retinoide). Confirmar con Caty si es correcto.

## Fases siguientes (solo tras aprobar la anterior)
- Fase 4: textos legales (borrador para revisar con abogada).

## Lo que tiene que hacer Caty
- Añadir `https://caty0deoliveira-bit.github.io/glow/` como sitio web en Amazon Afiliados España y EE. UU.
- Confirmar en el panel de YesStyle que las compras con `?rco=CATYSKIN1` se atribuyen.
- Conseguir con SiteStripe los ASIN de EE. UU. que faltan (ahora usan búsqueda).
- Datos legales para el aviso legal y la privacidad; revisión por abogada.
- Consultar con su gestoría el IVA del plan Glow con Caty (15 €, Stripe normal).
