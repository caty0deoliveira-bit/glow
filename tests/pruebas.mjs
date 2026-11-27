import {chromium} from 'playwright';
const URL=process.argv[2]||'http://localhost:8765/';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const pg=await ctx.newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!m.text().includes('INTERNET_DISCONNECTED'))errs.push(m.text())});
const eventos=[];
const rutaUso=r=>{try{eventos.push(...r.request().postDataJSON())}catch(e){}r.fulfill({status:201,body:''})};
await ctx.route('**/rest/v1/eventos_uso',rutaUso);
await pg.goto(URL);await pg.waitForFunction(()=>Q.length>0);
const res=await pg.evaluate(()=>{
 const out=[];const ok=(n,c,d='')=>out.push([n,!!c,d]);
 const set=(id,lab)=>{S.a[id]=qq(id).o.indexOf(lab)};const setm=(id,l)=>{S.a[id]=l.map(x=>qq(id).o.indexOf(x))};
 const all=P=>[...P.am,...P.pm];const prods=P=>all(P).flatMap(s=>s.pk);
 const RET=new Set(Object.entries(CAT).flatMap(([k,v])=>prodList(k).filter(p=>p.ret).map(p=>p.b+p.n)));
 // 1 ejemplo
 loadSample();let P=plan();const code=P.A.map(x=>x.L).join('');
 const pm3=P.pm.find(s=>s.id==='pm3');
 ok('1 Ejemplo DSPW + retinoide + noches sin retinoide limpias',code==='DSPW'&&P.pm.some(s=>s.cat==='retinoide')&&P.ret&&pm3&&pm3.pk.length&&pm3.pk.every(p=>!p.ret),code);
 // 2 embarazo
 loadSample();set('fase','Embarazo');P=plan();
 ok('2 Embarazo: sin retinoides, azelaico',!prods(P).some(p=>p.ret)&&!all(P).some(s=>s.cat==='retinoide')&&P.pm.find(s=>s.id==='pm2').cat==='azelaico'&&!P.ret);
 // 3 isotretinoína
 loadSample();setm('trat',['Isotretinoína oral']);P=plan();
 ok('3 Isotretinoína: sin retinoide ni exfoliantes, con alerta',!prods(P).some(p=>p.ret)&&!all(P).some(s=>['retinoide','bha','aha'].includes(s.cat))&&P.al.some(a=>/isotretino/i.test(a.t)));
 // 4 México
 loadSample();set('pais','México');P=plan();const amz=prods(P).filter(p=>p.lk.store!=='YesStyle');
 ok('4 México: amazon.com con -20',amz.length&&amz.every(p=>p.lk.url.includes('amazon.com/')&&p.lk.url.includes('tag=caterinedeoli-20')),amz.length+' enlaces');
 // 5 España
 loadSample();P=plan();const amzE=prods(P).filter(p=>p.lk.store!=='YesStyle');
 ok('5 España: amazon.es con -21',amzE.length&&amzE.every(p=>p.lk.url.includes('amazon.es/')&&p.lk.url.includes('tag=caterinedeoli-21')),amzE.length+' enlaces');
 // 6 marcas excluidas (aunque se añadan al catálogo)
 const bak=JSON.stringify(CAT);Object.keys(CAT).forEach(k=>{CAT[k].unshift(['Freshly Cosmetics','X',1,['lc','fa','co','na'],{es:'B000000000'},0]);CAT[k].unshift(['cocunat','Y',1,['lc','fa','co','na'],{es:'B000000001'},0])});
 let bad=0;for(const pais of ['España','México'])for(const pr of [0,1,2,3]){loadSample();set('pais',pais);S.a.pres=pr;setm('cos',['Natural o clean','Low cost']);bad+=prods(plan()).filter(p=>/freshly|cocunat/i.test(p.b)).length}
 CAT=JSON.parse(bak);ok('6 Nunca Freshly ni Cocunat',bad===0,bad+' encontrados');
 // 7 mínima
 loadSample();S.a.pasos=0;P=plan();
 ok('7 Rutina mínima: sin sérum de mañana, limpieza simple',!P.am.some(s=>s.id==='am2')&&P.pm[0].cat===null);
 // extra: Envío internacional en la tarjeta (México)
 loadSample();set('pais','México');S.plan='esencial';S.tab='rutina';S.screen='app';render(true);
 ok('4b México muestra «Envío internacional»',document.body.innerText.includes('Envío internacional'));
 ok('Sin precios de Amazon en la rutina',!/\d+[,.]\d{2}\s?€|\$\s?\d/.test(document.querySelector('#app').innerText));
 return out});
let fail=0;for(const [n,o,d] of res){console.log((o?'PASA ':'FALLA')+'  '+n+(d?'  ('+d+')':''));if(!o)fail++}

// ---------- Fase 2: pagos y bloqueo ----------
const UID='11111111-2222-4333-8444-555555555555';
let filas=[];let pagoURL=null;
await pg.route('**/auth/v1/signup',r=>r.fulfill({json:{access_token:'tok',refresh_token:'ref',expires_in:3600,user:{id:UID}}}));
await pg.route('**/rest/v1/suscripciones**',r=>r.fulfill({json:filas}));
await pg.route('https://buy.stripe.com/**',r=>{pagoURL=r.request().url();r.fulfill({body:'stripe',contentType:'text/html'})});
await pg.evaluate(()=>{localStorage.clear()});await pg.reload();await pg.waitForFunction(()=>Q.length>0);
const r2=await pg.evaluate(()=>{loadSample();S.tab='rutina';save();render(true);const t=document.querySelector('#app').innerText;return{lock:t.includes('Elige un plan'),comprar:t.includes('Comprar')}});
const res2=[['Sin pagar: rutina bloqueada y sin productos',r2.lock&&!r2.comprar]];
await pg.click('[data-act="buy"][data-arg="esencial"]');await pg.waitForTimeout(1500);
res2.push(['Pagar abre Stripe con el id de la usuaria',!!pagoURL&&pagoURL.startsWith('https://buy.stripe.com/5kQaEY2Iu0OgcMf4oF53O03?client_reference_id='+UID)]);
filas=[{plan:'esencial',estado:'active'}];
await pg.goto(URL+'?pago=esencial');await pg.waitForFunction(()=>Q.length>0);
const vuelto=await pg.waitForFunction(()=>S.plan==='esencial',null,{timeout:8000}).then(()=>true).catch(()=>false);
res2.push(['Al volver del pago se activa Glow Esencial',vuelto&&!(await pg.evaluate(()=>location.search))]);
res2.push(['Con plan: la rutina muestra productos',await pg.evaluate(()=>{S.tab='rutina';render(true);return document.querySelector('#app').innerText.includes('Comprar')})]);
filas=[{plan:'esencial',estado:'canceled'},{plan:'caty',estado:'active'}];
res2.push(['Gana el plan activo más alto',await pg.evaluate(async()=>{await syncPlan();return S.plan==='caty'})]);
res2.push(['Borrar todo mantiene el plan',await pg.evaluate(()=>{ACT.resetyes();return S.plan==='caty'&&!!JSON.parse(localStorage.getItem('glow.cuenta')).uid})]);
filas=[{plan:'caty',estado:'canceled'}];
res2.push(['Cancelada: vuelve a gratis',await pg.evaluate(async()=>{await syncPlan();return S.plan==='free'})]);
for(const [n,o] of res2){console.log((o?'PASA ':'FALLA')+'  '+n);if(!o)fail++}
await pg.unrouteAll({behavior:'ignoreErrors'});

// ---------- Invitaciones y opiniones ----------
const venceF=new Date(Date.now()+7*864e5).toISOString();let opinion=null;
await pg.route('**/rest/v1/rpc/canjear_invitacion',r=>r.fulfill({json:venceF}));
await pg.route('**/rest/v1/opiniones',r=>{opinion=r.request().postDataJSON();r.fulfill({status:201,body:''})});
await pg.route('**/auth/v1/signup',r=>r.fulfill({json:{access_token:'tok',refresh_token:'ref',expires_in:3600,user:{id:UID}}}));
await pg.route('**/rest/v1/suscripciones**',r=>r.fulfill({json:filas}));
await pg.evaluate(()=>localStorage.clear());
filas=[{plan:'esencial',estado:'active',vence:venceF}];
await pg.goto(URL+'?invitacion=AMIGAS-TEST');await pg.waitForFunction(()=>Q.length>0);
const inv=await pg.waitForFunction(()=>S.inv&&S.plan==='esencial'&&!!S.vence,null,{timeout:8000}).then(()=>true).catch(()=>false);
const res3=[['Invitación: activa Glow Esencial con fecha de fin',inv]];
res3.push(['Invitación: rutina desbloqueada',await pg.evaluate(()=>{const k={inv:S.inv,v:S.vence,p:S.plan};loadSample();Object.assign(S,{inv:k.inv,vence:k.v,plan:k.p,screen:'app',tab:'rutina'});render(true);return document.querySelector('#app').innerText.includes('Comprar')})]);
res3.push(['Mi piel muestra la tarjeta de opinión',await pg.evaluate(()=>{S.tab='piel';render(true);return document.querySelector('#app').innerText.includes('Dar mi opinión')})]);
await pg.click('[data-act="opinion"]');await pg.click('[data-act="rate"][data-arg="general:5"]');await pg.click('[data-act="rate"][data-arg="asistente:4"]');
await pg.fill('#opTxt','Me encantó el cuestionario');await pg.click('[data-act="sendop"]');await pg.waitForTimeout(800);
res3.push(['Opinión enviada con puntuaciones y texto',!!opinion&&opinion.general===5&&opinion.asistente===4&&opinion.texto==='Me encantó el cuestionario']);
res3.push(['Amiga en prueba: sin botones de pago en ninguna pestaña',await pg.evaluate(()=>{for(const t of ['piel','sim','rutina','msgs','aj']){S.tab=t;S.seg='caty';render(true);if(document.querySelector('[data-act="buy"],[data-act="plans"],[data-act="portal"]'))return false}return true})]);
res3.push(['Invitación caducada: vuelve a bloquear',await pg.evaluate(()=>{S.vence=new Date(Date.now()-1000).toISOString();return !paid()})]);
for(const [n,o] of res3){console.log((o?'PASA ':'FALLA')+'  '+n);if(!o)fail++}
await pg.unrouteAll({behavior:'ignoreErrors'});

// ---------- Fase 3: chat, perfil compartido y contador ----------
await ctx.route('**/rest/v1/eventos_uso',rutaUso);
let perfilEnviado=null,mensajeEnviado=null,msgs=[];
await pg.route('**/auth/v1/signup',r=>r.fulfill({json:{access_token:'tok',refresh_token:'ref',expires_in:3600,user:{id:UID}}}));
await pg.route('**/rest/v1/suscripciones**',r=>r.fulfill({json:[{plan:'caty',estado:'active',vence:null}]}));
await pg.route('**/rest/v1/perfiles**',r=>{perfilEnviado=r.request().postDataJSON();r.fulfill({status:201,body:''})});
await pg.route('**/rest/v1/rpc/enviar_mensaje',r=>{mensajeEnviado=r.request().postDataJSON();msgs.push({id:1,de:'usuaria',texto:mensajeEnviado.p_texto,creado:new Date().toISOString(),leido:false});r.fulfill({json:1})});
await pg.route('**/rest/v1/rpc/marcar_leidos',r=>r.fulfill({json:null}));
await pg.route('**/rest/v1/mensajes**',r=>r.fulfill({json:msgs}));
await pg.evaluate(()=>localStorage.clear());await pg.reload();await pg.waitForFunction(()=>Q.length>0);
await pg.evaluate(()=>{loadSample();S.plan='caty';S.tab='msgs';S.seg='caty';save();render(true)});
const res4=[['Chat: primero pide permiso para compartir el perfil',await pg.evaluate(()=>!!document.querySelector('[data-act="perfilsi"]')&&!document.querySelector('#chatbox'))]];
await pg.fill('#alias','Ana');await pg.click('[data-act="perfilsi"]');await pg.waitForTimeout(800);
res4.push(['Perfil compartido con consentimiento (tipo Baumann, alias y rutina)',!!perfilEnviado&&perfilEnviado.alias==='Ana'&&perfilEnviado.resumen?.tipo_baumann==='DSPW'&&perfilEnviado.resumen?.rutina?.manana?.length>0]);
await pg.fill('#chatbox','Hola Caty, ¿puedo usar el retinol con la vitamina C?');await pg.click('[data-act="send"]');await pg.waitForTimeout(1200);
res4.push(['Chat: el mensaje llega al servidor',mensajeEnviado?.p_texto==='Hola Caty, ¿puedo usar el retinol con la vitamina C?']);
res4.push(['Chat: aparece en la conversación y cuenta 1 de 10',await pg.evaluate(()=>document.querySelector('.thread').innerText.includes('retinol')&&document.body.innerText.includes('Te quedan 9 de 10'))]);
msgs.push({id:2,de:'caty',texto:'¡Hola! Mejor en momentos distintos del día.',creado:new Date().toISOString(),leido:false});
res4.push(['Chat: carga la respuesta de Caty',await pg.evaluate(async()=>{await cargarChat();render(true);return document.querySelector('.thread').innerText.includes('momentos distintos')})]);
res4.push(['Plan Esencial: el chat sigue bloqueado',await pg.evaluate(()=>{S.plan='esencial';S.inv=false;S.vence=null;render(true);return !document.querySelector('#chatbox')&&!!document.querySelector('[data-act="buy"][data-arg="caty"]')})]);
// contador: recorrido básico y comprobación de privacidad
await pg.evaluate(()=>{S.plan='esencial';save();ACT.tab('rutina');ACT.tab('piel');botStart();ACT.bot('no');ACT.bot('precio');});
await pg.evaluate(()=>{const a=document.createElement('div');S.tab='rutina';render(true)});
await pg.evaluate(()=>{const a=document.querySelector('a.buy[data-ev]');a.removeAttribute('href');a.click()});
await pg.evaluate(()=>enviaUso());await pg.waitForTimeout(800);
const nombresEv=new Set(eventos.map(e=>e.evento));
res4.push(['Contador: registra rutina, asistente y clic en «Comprar»',['rutina_vista','asistente_resp','comprar','pestana'].every(e=>nombresEv.has(e))]);
const texto=JSON.stringify(eventos.map(e=>[e.evento,e.dato]));
res4.push(['Contador: solo campos permitidos',eventos.every(e=>Object.keys(e).sort().join()==='dato,disp,evento,plan,prueba,version')]);
res4.push(['Contador: sin respuestas ni datos de salud',!/Perimenopausia|Manchas|Rojeces|DSPW|Ana|retinol|47/.test(texto)]);
res4.push(['Contador: «Comprar» guarda paso, tienda y opción',eventos.some(e=>e.evento==='comprar'&&/^am1:(Amazon España|YesStyle):1$/.test(e.dato))]);
for(const [n,o] of res4){console.log((o?'PASA ':'FALLA')+'  '+n);if(!o)fail++}
await pg.unrouteAll({behavior:'ignoreErrors'});

// ---------- Panel de Caty ----------
const adm=await ctx.newPage();adm.on('pageerror',e=>errs.push('admin: '+e.message));
let respuesta=null;
await adm.route('**/rest/v1/rpc/reclamar_admin',r=>r.fulfill({json:true}));
await adm.route('**/rest/v1/rpc/conversaciones',r=>r.fulfill({json:[{user_id:UID,alias:'Ana',email:'ana@ejemplo.com',plan:'caty',ultimo:new Date().toISOString(),ultimo_texto:'¿Puedo usar retinol?',ultimo_de:'usuaria',sin_leer:1,este_mes:1,comparte_perfil:true}]}));
await adm.route('**/rest/v1/mensajes**',r=>r.fulfill({json:[{de:'usuaria',texto:'¿Puedo usar retinol?',creado:new Date().toISOString()}]}));
await adm.route('**/rest/v1/perfiles**',r=>r.fulfill({json:[{alias:'Ana',resumen:{tipo_baumann:'DSPW',edad:'47',objetivos:['Más firmeza'],rutina:{manana:['Limpieza'],noche:['Retinoide']}},actualizado:new Date().toISOString()}]}));
await adm.route('**/rest/v1/rpc/marcar_leidos',r=>r.fulfill({json:null}));
await adm.route('**/rest/v1/rpc/responder_mensaje',r=>{respuesta=r.request().postDataJSON();r.fulfill({json:2})});
await adm.route('**/rest/v1/rpc/resumen_uso',r=>r.fulfill({json:[{evento:'abrir',dato:'navegador',personas:8,veces:20},{evento:'abrir',dato:'instalada',personas:2,veces:5},{evento:'cuestionario_inicio',dato:null,personas:9,veces:9},{evento:'seccion',dato:'2',personas:8,veces:8},{evento:'seccion',dato:'5',personas:6,veces:6},{evento:'cuestionario_fin',dato:null,personas:5,veces:5},{evento:'comprar',dato:'am4:Amazon España:1',personas:3,veces:4},{evento:'asistente_resp',dato:'precio',personas:2,veces:2},{evento:'opinion_enviada',dato:null,personas:4,veces:4}]}));
await adm.route('**/rest/v1/rpc/uso_diario',r=>r.fulfill({json:[{dia:'2026-11-27',personas:6},{dia:'2026-11-28',personas:4}]}));
await adm.route('**/rest/v1/opiniones**',r=>r.fulfill({json:[{creado:new Date().toISOString(),general:5,cuestionario:4,rutina:5,asistente:3,texto:'Muy clara',plan:'esencial'}]}));
await adm.route('**/rest/v1/rpc/lista_invitaciones',r=>r.fulfill({json:[{codigo:'AMIGAS-TEST',plan:'esencial',dias:7,usos:3,usos_max:10,caduca:new Date(Date.now()+5*864e5).toISOString(),nota:'Prueba'}]}));
await adm.route('**/rest/v1/rpc/lista_suscripciones',r=>r.fulfill({json:[{email:'ana@ejemplo.com',plan:'caty',estado:'active',origen:'stripe',vence:null,creado:new Date().toISOString(),con_movil:true}]}));
await adm.goto(URL+'admin.html');
const res5=[['Panel: sin sesión pide el email',await adm.evaluate(()=>!!document.querySelector('#em')&&!document.querySelector('#em').value)]];
await adm.evaluate(()=>{localStorage.setItem('glow.admin',JSON.stringify({at:'t',rt:'r',exp:Date.now()/1000+3600}));localStorage.setItem('glow.admin.tab','uso')});
await adm.goto(URL+'admin.html');await adm.waitForSelector('.kpi');
res5.push(['Panel · Uso: personas, recorrido y abandono del cuestionario',await adm.evaluate(()=>{const t=document.body.innerText;return t.includes('personas abrieron Glow')&&t.includes('Dónde abandonan el cuestionario')&&t.includes('Le frenó el precio')&&t.includes('Protector solar')})]);
await adm.screenshot({path:'tests/capturas/admin-uso.png',fullPage:true});
await adm.click('[data-tab="msgs"]');await adm.waitForSelector('#resp');
await adm.click('#verp');
res5.push(['Panel · Mensajes: hilo y perfil compartido',await adm.evaluate(()=>document.querySelector('#th').innerText.includes('retinol')&&document.querySelector('#perfil').innerText.includes('DSPW'))]);
await adm.fill('#resp','Sí, pero en noches distintas.');await adm.click('#responder');await adm.waitForTimeout(600);
res5.push(['Panel · Mensajes: la respuesta se envía a esa usuaria',respuesta?.p_user===UID&&respuesta?.p_texto==='Sí, pero en noches distintas.']);
await adm.screenshot({path:'tests/capturas/admin-mensajes.png',fullPage:true});
await adm.click('[data-tab="ops"]');await adm.waitForSelector('.kpi');
res5.push(['Panel · Opiniones: media y comentarios',await adm.evaluate(()=>document.body.innerText.includes('Muy clara')&&document.body.innerText.includes('5,0'))]);
await adm.click('[data-tab="inv"]');await adm.waitForSelector('#crear');
res5.push(['Panel · Invitaciones: usos y crear nueva',await adm.evaluate(()=>document.body.innerText.includes('3 de 10'))]);
await adm.click('[data-tab="subs"]');await adm.waitForSelector('#pasar');
res5.push(['Panel · Suscripciones: lista y pasar acceso',await adm.evaluate(()=>document.body.innerText.includes('ana@ejemplo.com'))]);
for(const [n,o] of res5){console.log((o?'PASA ':'FALLA')+'  '+n);if(!o)fail++}
await adm.close();
// capturas de pantallas
await pg.evaluate(()=>{localStorage.clear()});await pg.reload();await pg.waitForFunction(()=>Q.length>0);
await pg.screenshot({path:'tests/capturas/s1-bienvenida.png'});
await pg.evaluate(()=>{loadSample();S.plan='esencial';S.tab='rutina';save();render(true)});await pg.screenshot({path:'tests/capturas/s2-rutina.png'});
await pg.evaluate(()=>{S.tab='msgs';render(true)});await pg.screenshot({path:'tests/capturas/s3-mensajes.png'});
await pg.evaluate(()=>{S.tab='aj';render(true)});await pg.screenshot({path:'tests/capturas/s4-ajustes.png',fullPage:true});
// sin conexión
await pg.waitForFunction(()=>navigator.serviceWorker&&navigator.serviceWorker.controller,null,{timeout:10000}).catch(async()=>{await pg.reload();});
await pg.waitForTimeout(1500);await ctx.setOffline(true);await pg.reload();
const off=await pg.waitForFunction(()=>typeof Q!=='undefined'&&Q.length>0,null,{timeout:8000}).then(()=>true).catch(()=>false);
console.log((off?'PASA ':'FALLA')+'  Funciona sin conexión');if(!off)fail++;
await pg.screenshot({path:'tests/capturas/s5-offline.png'});
console.log('Errores JS:',errs.length?errs:'ninguno');
await b.close();process.exit(fail||errs.length?1:0);
