// Glow by Caty · lógica de avisos push (sin dependencias propias; se inyectan db y enviar).
export const APP = 'https://caty0deoliveira-bit.github.io/glow/';
const ACTIVO = ['active', 'trialing', 'past_due'];
export const TEXTOS = {
  aCaty: { title: 'Nuevo mensaje en Glow', body: 'Una usuaria te escribió. Ábrelo en tu panel.', url: APP + 'admin.html', tag: 'glow-admin' },
  aUsuaria: { title: 'Caty te respondió', body: 'Abre Glow para leer su mensaje.', url: APP + '?abrir=caty', tag: 'glow-caty' },
  asistente: { title: 'Asistente de Caty', body: '¿Pudiste conseguir tus productos? Cuéntame cómo vas.', url: APP + '?abrir=asistente', tag: 'glow-asistente' },
};
const tienePlan = (filas, ahora) => filas.some(s => ACTIVO.includes(s.estado) && (!s.vence || new Date(s.vence).getTime() > ahora));

// db: { mensaje(id), marcarAvisado(id), subsAdmin(), subsDe(uid), subsAsistente(ahoraISO), planes(uid), marcarAsistente(endpoint), borrarSub(endpoint) }
// enviar(sub, payload) -> statusCode
export async function enviarA(subs, payload, db, enviar) {
  let ok = 0;
  for (const s of subs) {
    let code = 0;
    try { code = await enviar(s, payload); } catch (e) { code = e?.statusCode || 0; }
    if (code === 404 || code === 410) await db.borrarSub(s.endpoint);
    else if (code >= 200 && code < 300) ok++;
  }
  return ok;
}

export async function porMensaje(id, db, enviar) {
  const m = await db.mensaje(id);
  if (!m || m.avisado) return { enviados: 0, motivo: 'nada' };
  await db.marcarAvisado(m.id);
  if (m.de === 'usuaria') return { enviados: await enviarA(await db.subsAdmin(), TEXTOS.aCaty, db, enviar) };
  return { enviados: await enviarA(await db.subsDe(m.user_id), TEXTOS.aUsuaria, db, enviar) };
}

export async function asistentePendiente(db, enviar, ahora = Date.now()) {
  const subs = await db.subsAsistente(new Date(ahora).toISOString());
  let enviados = 0;
  for (const s of subs) {
    await db.marcarAsistente(s.endpoint); // una sola vez, pase lo que pase
    if (!tienePlan(await db.planes(s.user_id), ahora)) continue;
    enviados += await enviarA([s], TEXTOS.asistente, db, enviar);
  }
  return { enviados };
}
