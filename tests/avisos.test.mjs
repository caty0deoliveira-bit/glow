// node tests/avisos.test.mjs
import { porMensaje, asistentePendiente, TEXTOS } from '../supabase/functions/avisos/logica.js';
let fallos = 0; const ok = (n, c) => { console.log((c ? 'PASA ' : 'FALLA') + '  ' + n); if (!c) fallos++; };
const mk = (o = {}) => { const log = { enviados: [], borrados: [], avisados: [], asistente: [] }; return { log, db: {
  mensaje: async id => o.msgs?.[id], marcarAvisado: async id => { log.avisados.push(id); if (o.msgs?.[id]) o.msgs[id].avisado = true; },
  subsAdmin: async () => o.admin || [], subsDe: async uid => (o.subs || []).filter(s => s.user_id === uid),
  subsAsistente: async () => o.pend || [], planes: async uid => o.planes?.[uid] || [],
  marcarAsistente: async ep => log.asistente.push(ep), borrarSub: async ep => log.borrados.push(ep) },
  enviar: async (s, p) => { log.enviados.push([s.endpoint, p.tag]); return o.code?.[s.endpoint] ?? 201; } }; };
let t = mk({ msgs: { 1: { id: 1, user_id: 'u1', de: 'usuaria', avisado: false } }, admin: [{ endpoint: 'caty1' }] });
await porMensaje(1, t.db, t.enviar); ok('Mensaje de usuaria avisa a Caty', t.log.enviados[0]?.[0] === 'caty1' && t.log.enviados[0][1] === TEXTOS.aCaty.tag);
await porMensaje(1, t.db, t.enviar); ok('No avisa dos veces el mismo mensaje', t.log.enviados.length === 1);
t = mk({ msgs: { 2: { id: 2, user_id: 'u1', de: 'caty', avisado: false } }, subs: [{ endpoint: 'a', user_id: 'u1' }, { endpoint: 'b', user_id: 'u2' }] });
await porMensaje(2, t.db, t.enviar); ok('Respuesta de Caty avisa solo a esa usuaria', t.log.enviados.length === 1 && t.log.enviados[0][0] === 'a');
t = mk({ msgs: { 3: { id: 3, user_id: 'u1', de: 'caty', avisado: false } }, subs: [{ endpoint: 'viejo', user_id: 'u1' }], code: { viejo: 410 } });
await porMensaje(3, t.db, t.enviar); ok('Borra suscripciones caducadas (410)', t.log.borrados[0] === 'viejo');
const fut = new Date(Date.now() + 864e5).toISOString(), pas = new Date(Date.now() - 864e5).toISOString();
t = mk({ pend: [{ endpoint: 'p1', user_id: 'u1' }, { endpoint: 'p2', user_id: 'u2' }, { endpoint: 'p3', user_id: 'u3' }], planes: { u1: [{ estado: 'active', vence: null }], u2: [{ estado: 'active', vence: pas }], u3: [{ estado: 'canceled' }] } });
const r = await asistentePendiente(t.db, t.enviar);
ok('Asistente: avisa solo a quien tiene plan vigente', r.enviados === 1 && t.log.enviados[0][0] === 'p1' && t.log.enviados[0][1] === TEXTOS.asistente.tag);
ok('Asistente: marca todas como hechas (no repite)', t.log.asistente.length === 3);
process.exit(fallos ? 1 : 0);
