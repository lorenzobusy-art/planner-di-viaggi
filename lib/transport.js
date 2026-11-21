"use strict";
/* ===== trasporti: ricerca volo dal numero + programma del viaggio ===== */
BK.out.f.push(["arr","Ora arrivo","","time"]);BK.ret.f.push(["arr","Ora arrivo","","time"]);
const lsg=k=>{try{return localStorage.getItem(k)||""}catch(e){return""}},lss=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const GC=(()=>{try{return JSON.parse(lsg("geoc")||"{}")}catch(e){return{}}})();
async function geo(q){q=(q||"").trim();if(!q)return null;if(GC[q])return GC[q];
  const r=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q="+encodeURIComponent(q));if(!r.ok)return null;
  const j=await r.json();if(!j[0])return null;GC[q]={lat:+j[0].lat,lon:+j[0].lon};lss("geoc",JSON.stringify(GC));return GC[q]}
let DR={};
async function drive(a,b){if(!a||!b)return null;const k=[a.lat,a.lon,b.lat,b.lon].map(x=>x.toFixed(3)).join();if(DR[k])return DR[k];
  try{const r=await fetch("https://router.project-osrm.org/route/v1/driving/"+a.lon+","+a.lat+";"+b.lon+","+b.lat+"?overview=false");const j=await r.json();
    if(!j.routes||!j.routes[0])return null;return DR[k]={min:Math.round(j.routes[0].duration/60*1.1),km:j.routes[0].distance/1000}}catch(e){return null}}
const tmin=s=>{const m=/(\d+)-(\d+)-(\d+)[ T](\d+):(\d+)/.exec(s||"");return m?Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5])/6e4:null};
const fT=m=>{const d=new Date(m*6e4);return d.getUTCDate()+" "+["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"][d.getUTCMonth()]+" · "+pad(d.getUTCHours())+":"+pad(d.getUTCMinutes())};
const fD=m=>m>=60?Math.floor(m/60)+" h "+(m%60?pad(m%60)+" min":""):m+" min";
/* ---- ricerca del volo (AeroDataBox) ---- */
async function flightLookup(num,date){
  const key=lsg("adbkey");if(!key)throw{code:"nokey"};
  const r=await fetch("https://aerodatabox.p.rapidapi.com/flights/number/"+encodeURIComponent(num.replace(/\s+/g,"").toUpperCase())+"/"+date+"?withLocation=true",{headers:{"x-rapidapi-key":key,"x-rapidapi-host":"aerodatabox.p.rapidapi.com"}});
  if(r.status===204||r.status===404)throw{code:"nf"};if(r.status===401||r.status===403)throw{code:"key"};if(!r.ok)throw{code:"http"};
  const j=await r.json();if(!j||!j[0])throw{code:"nf"};return j[0]}
function mapFlight(f){
  const D=f.departure||{},A=f.arrival||{},tl=x=>x?(x.scheduledTime?x.scheduledTime.local:x.scheduledTimeLocal)||"":"",rl=x=>x?(x.revisedTime?x.revisedTime.local:x.revisedTimeLocal)||"":"";
  const cut=s=>s?s.slice(0,16):"",ap=x=>x.airport||{},nm=x=>(ap(x).municipalityName||ap(x).name||"")+(ap(x).iata?" ("+ap(x).iata+")":"");
  const dep=cut(tl(D)),arrt=cut(tl(A)),loc=x=>ap(x).location||{};
  const du=D.scheduledTime&&A.scheduledTime&&D.scheduledTime.utc&&A.scheduledTime.utc?Math.round((tmin(A.scheduledTime.utc)-tmin(D.scheduledTime.utc))):0;
  return{num:f.number||"",from:nm(D),to:nm(A),date:dep.slice(0,10),time:dep.slice(11),arr:arrt.slice(11),dep,arrt,depRev:cut(rl(D)),arrRev:cut(rl(A)),
    dlat:loc(D).lat,dlon:loc(D).lon,alat:loc(A).lat,alon:loc(A).lon,al:(f.airline||{}).name||"",st:f.status||"",term:D.terminal||"",dur:du}}
const XK=["dep","arrt","depRev","arrRev","dlat","dlon","alat","alon","al","st","term","dur"];
editBook=function(k){
  const t=ens(trip()),b=t.book[k],B=BK[k],isF=k==="out"||k==="ret";
  const pre={out:{date:t.start,from:t.from,to:t.to},ret:{date:t.end,from:t.to,to:t.from},train:{date:t.start,from:t.from,to:t.to},car:{date:t.start,from:t.from,to:t.to},hotel:{in:t.start,out:t.end,addr:t.to}}[k];
  let ex={},looked=false;XK.forEach(x=>{if(b[x]!=null)ex[x]=b[x]});
  modal('<h3>'+B.t+'</h3>'+B.f.map(f=>'<label>'+f[1]+'<input data-k="'+f[0]+'" type="'+(f[3]||"text")+'" value="'+esc(b[f[0]]!=null?b[f[0]]:(pre[f[0]]||""))+'" placeholder="'+esc(f[2])+'"></label>').join("")+
   (isF?'<div class="lk"><button class="btn primary" id="bl" type="button">'+ic("spark")+'Compila dal numero volo</button></div><div id="bm" class="hint"></div>'+(lsg("adbkey")?"":'<label>Chiave AeroDataBox (RapidAPI, una volta sola)<input id="bkk" placeholder="Incolla la chiave"></label>'):"")+
   '<div class="mfoot"><button class="btn danger" id="bd" type="button" style="margin-right:auto">Svuota</button><button class="btn" id="bx" type="button">Annulla</button><button class="btn primary" id="bo" type="button">Salva</button></div>');
  const inp=n=>document.querySelector('#layer [data-k="'+n+'"]');
  $("#bx").onclick=closeLayer;$("#bd").onclick=()=>{t.book[k]={};save();closeLayer();renderAll()};
  if(isF)$("#bl").onclick=async()=>{const msg=$("#bm");const kk=$("#bkk");if(kk&&kk.value.trim())lss("adbkey",kk.value.trim());
    const n=inp("num").value.trim(),d=inp("date").value;if(!n||!d){msg.textContent="Inserisci numero volo e data.";return}
    msg.textContent="Cerco il volo…";
    try{const m=mapFlight(await flightLookup(n,d));["num","from","to","date","time","arr"].forEach(x=>{if(m[x])inp(x).value=m[x]});XK.forEach(x=>{if(m[x]!==""&&m[x]!=null)ex[x]=m[x]});looked=true;
      msg.textContent="Trovato: "+(m.al?m.al+" · ":"")+m.from+" → "+m.to+(m.st?" · "+m.st:"")+". Controlla e premi Salva."}
    catch(e){msg.textContent=e.code==="nokey"?"Serve la chiave AeroDataBox (campo qui sotto).":e.code==="key"?"Chiave non valida.":e.code==="nf"?"Volo non trovato per quella data.":"Ricerca non riuscita."}};
  $("#bo").onclick=()=>{const o={};document.querySelectorAll("#layer [data-k]").forEach(i=>o[i.dataset.k]=i.value.trim());
    if(isF&&!looked){ex.dep=o.date&&o.time?o.date+" "+o.time:"";ex.arrt=o.arr&&o.date?(o.arr<o.time?addDays(o.date,1):o.date)+" "+o.arr:"";ex.depRev="";ex.arrRev=""}
    t.book[k]=Object.assign({},isF?ex:{},o);save();closeLayer();renderAll()}};
/* ---- programma del viaggio ---- */
let TV=0;
async function apt(x,which,t){const lat=x[which+"lat"],lon=x[which+"lon"];if(lat!=null&&lon!=null)return{lat:+lat,lon:+lon};
  const nm=which==="d"?x.from:x.to;return geo((nm||"").replace(/\(.*?\)/,"")+" aeroporto")}
async function legs(t){
  const o=t.book.out,r=t.book.ret,buf=+(t.buf||120),park=15,steps=[],warn=[];
  const home=await geo(t.from),h=t.book.hotel,hq=h.addr||(h.name?h.name+" "+(t.to||""):""),hot=await geo(hq);
  if(!t.from)warn.push("Imposta «Partenza da» nelle impostazioni del viaggio.");
  const one=async(f,title,startPlace,endPlace,startPt,endPt,startLbl,endLbl)=>{
    const S=[];const dep=tmin(f.depRev||f.dep),arr=tmin(f.arrRev||f.arrt);
    if(dep==null){return[{lbl:"Inserisci data e ora del volo",sub:title}]}
    const ap1=await apt(f,"d",t),ap2=await apt(f,"a",t),d1=await drive(startPt,ap1),d2=await drive(ap2,endPt);
    const chk=dep-buf,leave=d1?chk-park-d1.min:null;
    if(leave!=null)S.push({m:leave,lbl:"Parti da "+startLbl,sub:d1.km.toFixed(0)+" km · circa "+fD(d1.min)+" in auto (senza traffico) + "+park+" min parcheggio",gm:[startLbl,(f.from||"aeroporto")]});
    else S.push({m:null,lbl:"Spostamento verso l'aeroporto",sub:"Manca "+(startPt?"l'aeroporto":"l'indirizzo di partenza")+" per calcolarlo"});
    S.push({m:chk,lbl:"Arrivo in aeroporto"+(f.term?" · terminal "+f.term:""),sub:"Check-in e controlli ("+fD(buf)+" prima)"});
    S.push({m:dep-40,lbl:"Imbarco",sub:"circa 40 min prima del decollo"});
    S.push({m:dep,lbl:"Volo "+(f.num||"")+(f.al?" · "+f.al:""),sub:(f.from||"")+" → "+(f.to||"")+(f.depRev&&f.depRev!==f.dep?" · orario aggiornato (era "+f.dep.slice(11)+")":"")+(f.st&&!/expected|scheduled/i.test(f.st)?" · "+f.st:"")});
    if(arr!=null){S.push({m:arr,lbl:"Atterraggio",sub:(f.to||"")+(f.arrRev&&f.arrRev!==f.arrt?" · orario aggiornato":"")});
      if(d2)S.push({m:arr+30+d2.min,lbl:"Arrivo a "+endLbl,sub:"30 min per uscita/bagagli + "+d2.km.toFixed(0)+" km · circa "+fD(d2.min)+" in auto o taxi"})}
    return S};
  if(o.dep||o.date){steps.push({hd:"Andata"});steps.push(...await one(o.dep?o:Object.assign({},o,{dep:o.date+" "+(o.time||"")}),"Andata",t.from,t.to,home,hot,t.from||"casa",hot?(h.name||"hotel"):"destinazione"))}
  if(r.dep||r.date){steps.push({hd:"Ritorno"});
    const rf=Object.assign({},r);if(rf.dlat==null&&o.alat!=null){rf.dlat=o.alat;rf.dlon=o.alon}
    if(rf.alat==null&&o.dlat!=null){rf.alat=o.dlat;rf.alon=o.dlon}
    steps.push(...await one(rf.dep?rf:Object.assign({},rf,{dep:rf.date+" "+(rf.time||"")}),"Ritorno",t.to,t.from,hot,home,h.name||"hotel",t.from||"casa"))}
  return{steps,warn}}
async function renderTrasp(){
  const el=$("#trasp");if(!el)return;const t=ens(trip()),my=++TV;
  const head='<div class="ph">'+ic("route")+'Trasporti · programma del viaggio<span style="margin-left:auto;display:flex;gap:6px"><select id="tbuf" aria-label="Anticipo in aeroporto">'+[90,120,150,180].map(v=>'<option value="'+v+'"'+(v===+(t.buf||120)?" selected":"")+'>Check-in '+v+" min prima</option>").join("")+'</select><button class="btn sm" id="tref" type="button">Aggiorna</button></span></div>';
  if(!t.book.out.date&&!t.book.out.dep&&!t.book.ret.date&&!t.book.ret.dep){el.innerHTML=head+'<p class="hint" style="margin:0">Inserisci i voli in Prenotazioni: qui compare il programma con gli orari di partenza da casa, aeroporto, volo e ritorno.</p>';wire();return}
  el.innerHTML=head+'<p class="hint">Calcolo i tempi…</p>';wire();
  let R;try{R=await legs(t)}catch(e){R={steps:[],warn:["Calcolo non riuscito (rete). Premi Aggiorna."]}}
  if(my!==TV)return;
  el.innerHTML=head+(R.warn.length?'<p class="hint">'+R.warn.map(esc).join(" ")+'</p>':"")+'<div class="tl">'+R.steps.map(s=>s.hd?'<h4>'+s.hd+'</h4>':'<div class="ti"><b>'+(s.m!=null?fT(s.m):"—")+'</b><div><span>'+esc(s.lbl)+'</span><small>'+esc(s.sub||"")+'</small>'+(s.gm?'<a class="btn sm" target="_blank" rel="noopener" href="'+esc(LK.route(s.gm[0],s.gm[1]))+'">'+ic("ext")+'Percorso</a>':"")+'</div></div>').join("")+'</div><p class="hint">Tempi in auto stimati senza traffico (OpenStreetMap). «Aggiorna» ricontrolla il volo e i percorsi.</p>';wire();
  function wire(){const b=$("#tbuf");if(b)b.onchange=()=>{t.buf=+b.value;save();renderTrasp()};
    const r=$("#tref");if(r)r.onclick=async()=>{DR={};r.disabled=true;r.textContent="Aggiorno…";
      for(const k of ["out","ret"]){const f=t.book[k];if(f.num&&f.date&&lsg("adbkey")){try{const m=mapFlight(await flightLookup(f.num,f.date));XK.forEach(x=>{if(m[x]!==""&&m[x]!=null)f[x]=m[x]});f.depRev=m.depRev;f.arrRev=m.arrRev}catch(e){}}}
      save();renderTrasp()}}
}
{const c=$("#book");if(c)c.insertAdjacentHTML("beforebegin",'<div class="card" id="trasp"></div>')}
{const _r=renderAll;renderAll=function(){_r();renderTrasp()}}
renderTrasp();
