// Supabase Edge Function: avisos (sin verificación de JWT).
// GET  -> clave pública VAPID para que la app se suscriba.
// POST {mensaje:id}        -> avisa del mensaje nuevo (lo llama un disparador de la base de datos).
// POST {tipo:'asistente'}  -> envía los avisos del asistente que ya tocan (lo llama una tarea cada 15 min).
// Las claves VAPID se generan aquí la primera vez y se guardan en config_privada: nadie tiene que copiarlas.
import { generateVAPIDKeys, sendNotification } from 'npm:web-push-neo@0.1.2';
import { porMensaje, asistentePendiente } from './logica.js';

const URL_DB = Deno.env.get('SUPABASE_URL')!;
function claveServidor(): string {
  try { const k = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}'); const v = Object.values(k)[0]; if (v) return String(v); } catch { /* sigue */ }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}
const CLAVE = claveServidor();
const h: Record<string, string> = { apikey: CLAVE, 'Content-Type': 'application/json' };
if (CLAVE.startsWith('eyJ')) h.Authorization = `Bearer ${CLAVE}`;
async function rest(ruta: string, init: RequestInit = {}) {
  const r = await fetch(`${URL_DB}/rest/v1/${ruta}`, { ...init, headers: { ...h, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`${ruta}: ${r.status} ${await r.text()}`);
  return r;
}
const json = async (ruta: string) => (await rest(ruta)).json();
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, apikey, authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

let VAPID: { publicKey: string; privateKey: string } | null = null;
async function vapid() {
  if (VAPID) return VAPID;
  const leer = async () => Object.fromEntries((await json('config_privada?clave=in.(vapid_publica,vapid_privada)&select=clave,valor')).map((f: any) => [f.clave, f.valor]));
  let c = await leer();
  if (!c.vapid_publica || !c.vapid_privada) {
    const k = await generateVAPIDKeys();
    await rest('config_privada', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify([{ clave: 'vapid_publica', valor: k.publicKey }, { clave: 'vapid_privada', valor: k.privateKey }]) });
    c = await leer();
  }
  VAPID = { publicKey: c.vapid_publica, privateKey: c.vapid_privada };
  return VAPID;
}

const db = {
  mensaje: async (id: number) => (await json(`mensajes?id=eq.${Number(id)}&select=id,user_id,de,avisado`))[0],
  marcarAvisado: (id: number) => rest(`mensajes?id=eq.${Number(id)}`, { method: 'PATCH', body: JSON.stringify({ avisado: true }) }),
  subsAdmin: () => json('avisos_push?es_admin=eq.true&select=endpoint,p256dh,auth,user_id'),
  subsDe: (uid: string) => json(`avisos_push?user_id=eq.${encodeURIComponent(uid)}&es_admin=eq.false&select=endpoint,p256dh,auth,user_id`),
  subsAsistente: (ahora: string) => json(`avisos_push?es_admin=eq.false&bot_enviado=eq.false&bot_en=lte.${encodeURIComponent(ahora)}&select=endpoint,p256dh,auth,user_id&limit=200`),
  planes: (uid: string) => json(`suscripciones?user_id=eq.${encodeURIComponent(uid)}&select=estado,vence`),
  marcarAsistente: (ep: string) => rest(`avisos_push?endpoint=eq.${encodeURIComponent(ep)}`, { method: 'PATCH', body: JSON.stringify({ bot_enviado: true }) }),
  borrarSub: (ep: string) => rest(`avisos_push?endpoint=eq.${encodeURIComponent(ep)}`, { method: 'DELETE' }),
};
async function enviar(s: any, payload: unknown) {
  const k = await vapid();
  const r = await sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), {
    TTL: 86400, urgency: 'normal', vapidDetails: { subject: 'https://caty0deoliveira-bit.github.io/glow/', publicKey: k.publicKey, privateKey: k.privateKey },
  });
  return r.statusCode;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    if (req.method === 'GET') return Response.json({ publicKey: (await vapid()).publicKey }, { headers: cors });
    if (req.method !== 'POST') return new Response('Método no permitido', { status: 405, headers: cors });
    const b = await req.json().catch(() => ({}));
    if (b.mensaje) return Response.json(await porMensaje(b.mensaje, db, enviar), { headers: cors });
    if (b.tipo === 'asistente') return Response.json(await asistentePendiente(db, enviar), { headers: cors });
    return new Response('Nada que hacer', { status: 400, headers: cors });
  } catch (e) {
    console.error(e);
    return new Response('Error', { status: 500, headers: cors });
  }
});
