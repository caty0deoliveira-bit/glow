// Supabase Edge Function: stripe-webhook (sin verificación de JWT: la seguridad es la firma de Stripe).
// Secreto necesario: STRIPE_WEBHOOK_SECRET (lo pega Caty en Edge Functions → Secrets).
import { atender } from './logica.js';

const URL_DB = Deno.env.get('SUPABASE_URL')!;
// Clave de servidor: la nueva (sb_secret_…) o la antigua (service_role). Supabase la pone sola.
function claveServidor(): string {
  try { const k = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}'); const v = Object.values(k)[0]; if (v) return String(v); } catch { /* sigue */ }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}
const CLAVE = claveServidor();
const h: Record<string, string> = { apikey: CLAVE, 'Content-Type': 'application/json' };
if (CLAVE.startsWith('eyJ')) h.Authorization = `Bearer ${CLAVE}`;
async function rest(ruta: string, init: RequestInit) {
  const r = await fetch(`${URL_DB}/rest/v1/${ruta}`, { ...init, headers: { ...h, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`${ruta}: ${r.status} ${await r.text()}`);
  return r;
}
const db = {
  yaProcesado: async (id: string) => (await (await rest(`eventos_stripe?id=eq.${encodeURIComponent(id)}&select=id`, { method: 'GET' })).json()).length > 0,
  registrar: (id: string, tipo: string) => rest('eventos_stripe', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ id, tipo }) }),
  upsert: (fila: unknown) => rest('suscripciones?on_conflict=stripe_subscription', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(fila) }),
  update: (id: string, cambios: unknown) => rest(`suscripciones?stripe_subscription=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(cambios) }),
};

Deno.serve(async (req) => {
  try {
    return await atender(req, Deno.env.get('STRIPE_WEBHOOK_SECRET') || '', db);
  } catch (e) {
    console.error(e);
    return new Response('Error', { status: 500 }); // Stripe reintentará
  }
});
