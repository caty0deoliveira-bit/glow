// Glow by Caty · lógica del webhook de Stripe (sin dependencias, Web APIs estándar).
// Se usa desde index.ts (Supabase Edge Function) y desde las pruebas en Node.

export const PLANES_POR_ENLACE = {
  plink_1Ug2IuLoa4hwHC4QM3oZySim: 'esencial', // Glow Esencial, 10 €/mes (Managed Payments)
  plink_1Ug2WlLoa4hwHC4QJ9xHVyQC: 'caty',     // Glow con Caty, 15 €/mes (Stripe normal)
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enc = new TextEncoder();

// Verifica la cabecera Stripe-Signature (t=...,v1=...) con HMAC-SHA256.
export async function firmaValida(cuerpo, cabecera, secreto, ahora = Date.now() / 1000, tolerancia = 300) {
  if (!cabecera || !secreto) return false;
  let t = null; const v1 = [];
  for (const p of cabecera.split(',')) {
    const [k, v] = p.split('=');
    if (k === 't') t = Number(v); else if (k === 'v1' && v) v1.push(v);
  }
  if (!t || !v1.length || Math.abs(ahora - t) > tolerancia) return false;
  const clave = await crypto.subtle.importKey('raw', enc.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', clave, enc.encode(`${t}.${cuerpo}`)));
  const hex = [...mac].map(b => b.toString(16).padStart(2, '0')).join('');
  return v1.some(s => s.length === hex.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0);
}

// Convierte un evento de Stripe en una operación sobre la tabla suscripciones.
export function operacion(evento) {
  const o = evento?.data?.object || {};
  switch (evento?.type) {
    case 'checkout.session.completed': {
      if (o.mode !== 'subscription' || !o.subscription) return null;
      const plan = PLANES_POR_ENLACE[o.payment_link];
      if (!plan) return null; // no es de Glow (por ejemplo, otros productos de Caty)
      return {
        tipo: 'upsert',
        fila: {
          stripe_subscription: o.subscription,
          user_id: UUID.test(o.client_reference_id || '') ? o.client_reference_id : null,
          plan,
          estado: o.payment_status === 'paid' ? 'active' : 'incomplete',
          stripe_customer: o.customer || null,
          email: o.customer_details?.email || o.customer_email || null,
          actualizado: new Date().toISOString(),
        },
      };
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      if (!o.id) return null;
      return {
        tipo: 'update',
        id: o.id,
        cambios: { estado: evento.type === 'customer.subscription.deleted' ? 'canceled' : o.status, actualizado: new Date().toISOString() },
      };
    default:
      return null;
  }
}

// Atiende la petición. db = { yaProcesado(id), registrar(id,tipo), upsert(fila), update(id,cambios) }
export async function atender(req, secreto, db) {
  if (req.method !== 'POST') return new Response('Método no permitido', { status: 405 });
  const cuerpo = await req.text();
  if (!(await firmaValida(cuerpo, req.headers.get('stripe-signature'), secreto))) {
    return new Response('Firma no válida', { status: 400 });
  }
  let evento;
  try { evento = JSON.parse(cuerpo); } catch { return new Response('JSON no válido', { status: 400 }); }
  if (await db.yaProcesado(evento.id)) return new Response('Ya procesado', { status: 200 });
  const op = operacion(evento);
  if (op?.tipo === 'upsert') await db.upsert(op.fila);
  if (op?.tipo === 'update') await db.update(op.id, op.cambios);
  await db.registrar(evento.id, evento.type);
  return new Response(op ? 'OK' : 'Ignorado', { status: 200 });
}
