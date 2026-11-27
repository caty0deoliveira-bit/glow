import {chromium} from 'playwright';
const URL=process.argv[2]||'http://localhost:8765/';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
const pg=await ctx.newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!m.text().includes('INTERNET_DISCONNECTED'))errs.push(m.text())});
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
res3.push(['Invitación caducada: vuelve a bloquear',await pg.evaluate(()=>{S.vence=new Date(Date.now()-1000).toISOString();return !paid()})]);
for(const [n,o] of res3){console.log((o?'PASA ':'FALLA')+'  '+n);if(!o)fail++}
await pg.unrouteAll({behavior:'ignoreErrors'});
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
