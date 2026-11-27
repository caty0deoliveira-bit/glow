// node tests/webhook.test.mjs
import { atender, firmaValida, operacion } from '../supabase/functions/stripe-webhook/logica.js';
import { createHmac } from 'node:crypto';
const S = 'whsec_prueba_local';
const firmar = (b, t = Math.floor(Date.now() / 1000), s = S) => `t=${t},v1=${createHmac('sha256', s).update(`${t}.${b}`).digest('hex')}`;
const mem = () => { const ev = new Set(), filas = new Map(); return { filas, yaProcesado: async i => ev.has(i), registrar: async i => ev.add(i), upsert: async f => filas.set(f.stripe_subscription, { ...filas.get(f.stripe_subscription), ...f }), update: async (i, c) => filas.has(i) && filas.set(i, { ...filas.get(i), ...c }) }; };
const req = (b, sig) => new Request('http://x', { method: 'POST', body: b, headers: sig ? { 'stripe-signature': sig } : {} });
const uid = '3f2b8c1e-1d2a-4c5b-9e8f-0a1b2c3d4e5f';
const sesion = (pl, extra = {}) => JSON.stringify({ id: 'evt_' + Math.random(), type: 'checkout.session.completed', data: { object: { mode: 'subscription', subscription: 'sub_1', customer: 'cus_1', client_reference_id: uid, payment_status: 'paid', payment_link: pl, customer_details: { email: 'a@b.c' }, ...extra } } });
let fallos = 0; const ok = (n, c) => { console.log((c ? 'PASA ' : 'FALLA') + '  ' + n); if (!c) fallos++; };

ok('Rechaza sin firma', (await atender(req(sesion('x')), S, mem())).status === 400);
ok('Rechaza firma con otro secreto', (await atender(req(sesion('x'), firmar(sesion('x'), undefined, 'otro')), S, mem())).status === 400);
const b0 = sesion('plink_1Ug2IuLoa4hwHC4QM3oZySim');
ok('Rechaza firma caducada', !(await firmaValida(b0, firmar(b0, 1000), S)));
let db = mem(); let b = sesion('plink_1Ug2IuLoa4hwHC4QM3oZySim');
ok('Esencial: guarda plan y usuaria', (await atender(req(b, firmar(b)), S, db)).status === 200 && db.filas.get('sub_1')?.plan === 'esencial' && db.filas.get('sub_1')?.user_id === uid && db.filas.get('sub_1')?.estado === 'active');
db = mem(); b = sesion('plink_1Ug2WlLoa4hwHC4QJ9xHVyQC');
await atender(req(b, firmar(b)), S, db); ok('Glow con Caty: plan caty', db.filas.get('sub_1')?.plan === 'caty');
const c = JSON.stringify({ id: 'evt_c', type: 'customer.subscription.deleted', data: { object: { id: 'sub_1', status: 'canceled' } } });
await atender(req(c, firmar(c)), S, db); ok('Cancelación: estado canceled', db.filas.get('sub_1')?.estado === 'canceled');
db = mem(); b = sesion('plink_1QnGJGLoa4hwHC4QBPuYNSOZ'); await atender(req(b, firmar(b)), S, db); ok('Ignora otros productos de Caty', db.filas.size === 0);
db = mem(); b = sesion('plink_1Ug2IuLoa4hwHC4QM3oZySim', { client_reference_id: "x'; drop table" }); await atender(req(b, firmar(b)), S, db); ok('client_reference_id raro no se usa', db.filas.get('sub_1')?.user_id === null);
ok('Pago único se ignora', operacion({ type: 'checkout.session.completed', data: { object: { mode: 'payment', payment_link: 'plink_1Ug2IuLoa4hwHC4QM3oZySim' } } }) === null);
db = mem(); b = sesion('plink_1Ug2IuLoa4hwHC4QM3oZySim'); await atender(req(b, firmar(b)), S, db); db.filas.clear(); await atender(req(b, firmar(b)), S, db); ok('Evento repetido no se procesa dos veces', db.filas.size === 0);
process.exit(fallos ? 1 : 0);
