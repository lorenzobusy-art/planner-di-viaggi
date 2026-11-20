"use strict";
/* ===== extra: prenotazioni, spese, mappa strade, posizione ===== */
const ENC=encodeURIComponent;
function ens(t){t.from=t.from||"";t.to=t.to||"";if(!Array.isArray(t.people)||!t.people.length)t.people=["Io"];
  t.book=t.book||{};["out","ret","train","car","hotel"].forEach(k=>t.book[k]=t.book[k]||{});t.exp=t.exp||[];return t}
state.trips.forEach(ens);
const LK={
 gflights:(o,d,a,b)=>"https://www.google.com/travel/flights?q="+ENC("Voli da "+o+" a "+d+(a?" il "+a:"")+(b?" ritorno "+b:"")),
 fr24:n=>"https://www.flightradar24.com/data/flights/"+ENC(String(n).replace(/\s+/g,"").toLowerCase()),
 trenit:(o,d)=>"https://www.trenitalia.com/it.html#"+ENC(o+" "+d),
 gtrain:(o,d)=>"https://www.google.com/search?q="+ENC("treni da "+o+" a "+d),
 route:(o,d)=>"https://www.google.com/maps/dir/?api=1&origin="+ENC(o)+"&destination="+ENC(d)+"&travelmode=driving",
 apple:(o,d)=>"https://maps.apple.com/?saddr="+ENC(o)+"&daddr="+ENC(d)+"&dirflg=d",
 hotelG:(q)=>"https://www.google.com/travel/hotels/"+ENC(q),
 booking:q=>"https://www.booking.com/searchresults.it.html?ss="+ENC(q),
 trip:q=>"https://www.tripadvisor.it/Search?q="+ENC(q),
 fork:q=>"https://www.thefork.it/search?cityId=&queryText="+ENC(q),
 gm:q=>"https://www.google.com/maps/search/?api=1&query="+ENC(q)
};
const a$=(u,t)=>'<a class="btn sm" target="_blank" rel="noopener" href="'+esc(u)+'">'+ic("ext")+esc(t)+'</a>';
/* ---- viaggio: impostazioni ---- */
function openTrip(t){
  const nt=ens(t||newTrip(""));let col=nt.color,ppl=nt.people.slice();
  modal('<h3>'+(t?"Impostazioni viaggio":"Nuovo viaggio")+'</h3>'+
   '<label>Nome<input id="tn" value="'+esc(t?nt.name:"")+'" placeholder="Es. Estate a Lisbona" maxlength="60"></label>'+
   '<div class="two"><label>Partenza da<input id="tf" value="'+esc(nt.from)+'" placeholder="Es. Genova"></label><label>Destinazione<input id="tt" value="'+esc(nt.to)+'" placeholder="Es. Lisbona"></label></div>'+
   '<div class="two"><label>Andata<input id="ts" type="date" value="'+esc(nt.start)+'"></label><label>Ritorno<input id="te" type="date" value="'+esc(nt.end)+'"></label></div>'+
   '<label>Chi viaggia con te<div class="chips" id="pp"></div><div style="display:flex;gap:6px;margin-top:6px"><input id="pn" placeholder="Nome compagno di viaggio" maxlength="30"><button class="btn" id="pa" type="button">Aggiungi</button></div></label>'+
   '<label>Colore<span class="swatches" id="tc">'+TRIPCOL.map(c=>'<button type="button" style="--c:'+c+'" data-c="'+c+'" class="'+(c===col?"on":"")+'"></button>').join("")+'</span></label>'+
   '<div class="mfoot">'+(t&&state.trips.length>1?'<button class="btn danger" id="tdel" type="button" style="margin-right:auto">Elimina viaggio</button>':"")+
   '<button class="btn" id="tx" type="button">Annulla</button><button class="btn primary" id="tok" type="button">Salva</button></div>');
  const drawP=()=>{$("#pp").innerHTML=ppl.map((n,i)=>'<span class="chip2">'+esc(n)+(i?'<button type="button" data-i="'+i+'" aria-label="Rimuovi">×</button>':"")+'</span>').join("")};drawP();
  $("#pp").onclick=e=>{const b=e.target.closest("button");if(b){ppl.splice(+b.dataset.i,1);drawP()}};
  const addP=()=>{const v=$("#pn").value.trim();if(v&&!ppl.includes(v)){ppl.push(v);$("#pn").value="";drawP()}};
  $("#pa").onclick=addP;$("#pn").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addP()}});
  $("#tc").onclick=e=>{const b=e.target.closest("button");if(!b)return;col=b.dataset.c;$("#tc").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b))};
  $("#tx").onclick=closeLayer;
  $("#tok").onclick=()=>{addP();
    nt.name=$("#tn").value.trim()||"Nuovo viaggio";nt.start=$("#ts").value;nt.end=$("#te").value;nt.color=col;nt.from=$("#tf").value.trim();nt.to=$("#tt").value.trim();nt.people=ppl;
    if(nt.start&&nt.end&&nt.end<nt.start)nt.end=nt.start;
    if(!t){state.trips.push(nt);state.active=nt.id;flt.day=null;selId=null}
    save();closeLayer();renderAll();fit(true);if(nt.start)setCal(nt.start)};
  const del=$("#tdel");if(del)del.onclick=()=>{if(del.dataset.s!=="1"){del.dataset.s="1";del.textContent="Conferma eliminazione";return}
    state.trips=state.trips.filter(x=>x.id!==t.id);state.active=state.trips[0].id;save();closeLayer();renderAll();fit(true)};
}
/* ---- prenotazioni ---- */
const BK={
 out:{t:"Volo di andata",i:"route",f:[["num","Numero volo","Es. FR1234"],["date","Data","","date"],["time","Ora","","time"],["from","Da","Aeroporto/città"],["to","A","Aeroporto/città"]]},
 ret:{t:"Volo di ritorno",i:"route",f:[["num","Numero volo","Es. FR1235"],["date","Data","","date"],["time","Ora","","time"],["from","Da","Aeroporto/città"],["to","A","Aeroporto/città"]]},
 train:{t:"Treno (facoltativo)",i:"route",f:[["num","Treno / numero","Es. Frecciarossa 9612"],["date","Data","","date"],["time","Ora","","time"],["from","Da","Stazione"],["to","A","Stazione"]]},
 car:{t:"In macchina",i:"route",f:[["from","Partenza","Città o indirizzo"],["to","Arrivo","Città o indirizzo"],["date","Data","","date"],["note","Note","Soste, pedaggi…"]]},
 hotel:{t:"Hotel / alloggio",i:"cal",f:[["name","Nome struttura","Es. Hotel Roma"],["addr","Indirizzo / città","Es. Via…, Lisbona"],["in","Check-in","","date"],["out","Check-out","","date"]]}
};
function bsum(k,b){
  if(k==="hotel")return b.name?esc(b.name)+(b.in?" · "+fmtDate(b.in)+(b.out?" → "+fmtDate(b.out):""):""):"";
  if(k==="car")return b.from||b.to?esc((b.from||"?")+" → "+(b.to||"?"))+(b.date?" · "+fmtDate(b.date):""):"";
  return b.num||b.from?esc((b.num?b.num+" · ":"")+(b.from||"?")+" → "+(b.to||"?"))+(b.date?" · "+fmtDate(b.date):"")+(b.time?" "+esc(b.time):""):"";
}
function blinks(k,b,t){
  const o=b.from||t.from,d=b.to||t.to;let h="";
  if(k==="out"||k==="ret"){const O=k==="out"?(b.from||t.from):(b.from||t.to),D=k==="out"?(b.to||t.to):(b.to||t.from);
    if(b.num)h+=a$(LK.fr24(b.num),"FlightRadar24");
    if(O&&D)h+=a$(LK.gflights(O,D,b.date||(k==="out"?t.start:t.end)),"Google Flights");}
  if(k==="train"&&o&&d)h+=a$(LK.trenit(o,d),"Trenitalia")+a$(LK.gtrain(o,d),"Orari");
  if(k==="car"&&o&&d)h+=a$(LK.route(o,d),"Google Maps")+a$(LK.apple(o,d),"Apple Maps");
  if(k==="hotel"){const q=b.name?(b.name+" "+(b.addr||t.to)):(t.to||"");if(q)h+=a$(LK.booking(q),"Booking")+a$(LK.trip(q),"Tripadvisor")+a$(LK.hotelG(q),"Google Hotel");}
  return h;
}
function renderBook(){
  const t=ens(trip());const flightsOk=true;
  let h='<div class="ph">'+ic("route")+'Prenotazioni</div><div class="bk">';
  Object.keys(BK).forEach(k=>{const b=t.book[k],s=bsum(k,b);
    h+='<div class="bi"><b>'+ic(BK[k].i)+BK[k].t+'<button class="btn sm" type="button" data-bk="'+k+'" style="margin-left:auto">'+(s?"Modifica":"Aggiungi")+'</button></b>'+
      (s?'<span>'+s+'</span>':'<small>Non inserito</small>')+'<div class="lk">'+blinks(k,b,t)+'</div></div>'});
  h+='<div class="lk"><button class="btn primary sm" type="button" id="bkF">'+ic("spark")+'Cerca voli</button><button class="btn sm" type="button" id="bkH">'+ic("spark")+'Cerca hotel</button></div></div>';
  $("#book").innerHTML=h;
  $("#book").querySelectorAll("[data-bk]").forEach(b=>b.onclick=()=>editBook(b.dataset.bk));
  $("#bkF").onclick=openFlightSearch;$("#bkH").onclick=openHotelSearch;
}
function editBook(k){
  const t=ens(trip()),b=t.book[k],B=BK[k];
  const pre={out:{date:t.start,from:t.from,to:t.to},ret:{date:t.end,from:t.to,to:t.from},train:{date:t.start,from:t.from,to:t.to},car:{date:t.start,from:t.from,to:t.to},hotel:{in:t.start,out:t.end,addr:t.to}}[k];
  modal('<h3>'+B.t+'</h3>'+B.f.map(f=>'<label>'+f[1]+'<input data-k="'+f[0]+'" type="'+(f[3]||"text")+'" value="'+esc(b[f[0]]!=null?b[f[0]]:(pre[f[0]]||""))+'" placeholder="'+esc(f[2])+'"></label>').join("")+
   '<div class="mfoot"><button class="btn danger" id="bd" type="button" style="margin-right:auto">Svuota</button><button class="btn" id="bx" type="button">Annulla</button><button class="btn primary" id="bo" type="button">Salva</button></div>');
  $("#bx").onclick=closeLayer;
  $("#bd").onclick=()=>{t.book[k]={};save();closeLayer();renderAll()};
  $("#bo").onclick=()=>{const o={};document.querySelectorAll("#layer [data-k]").forEach(i=>o[i.dataset.k]=i.value.trim());t.book[k]=o;save();closeLayer();renderAll()};
}
/* ---- ricerca voli/hotel integrata (Expedia) ---- */
let MCP=null,SMP=null;
async function mcpCall(tool,input){
  if(!MCP)MCP=await claude.use("mcp");
  const r=await MCP.callTool("Expedia",tool,input);return r&&r.payload!==undefined?r.payload:r}
async function normalize(payload,kind){
  if(!SMP)SMP=await claude.use("sample");
  const raw=(typeof payload==="string"?payload:JSON.stringify(payload)).slice(0,14000);
  const shape=kind==="f"?'[{"label":"compagnia e orari","price":"prezzo con valuta","detail":"scali/durata","url":"link prenotazione o vuoto"}]':'[{"label":"nome hotel","price":"prezzo a notte","detail":"zona e voto","url":"link o vuoto"}]';
  const r=await SMP.json("Estrai al massimo 6 risultati dal seguente output di ricerca. Rispondi SOLO con JSON array di forma "+shape+". Dati:\n"+raw);
  return Array.isArray(r)?r:(r&&r.results)||[]}
function showRes(el,list,fallback){
  el.innerHTML=list.length?'<div class="fres">'+list.map(x=>'<div class="fr"><div><b>'+esc(x.label)+'</b><br><small>'+esc(x.detail||"")+'</small></div><div style="text-align:right"><b>'+esc(x.price||"")+'</b>'+(x.url&&/^https:/.test(x.url)?'<br><a target="_blank" rel="noopener" href="'+esc(x.url)+'">Apri</a>':"")+'</div></div>').join("")+'</div>':'<p>Nessun risultato.</p>'+fallback}
function openFlightSearch(){
  const t=ens(trip());
  modal('<h3>Cerca voli</h3><div class="two"><label>Da<input id="fo" value="'+esc(t.from)+'" placeholder="Es. Genova o GOA"></label><label>A<input id="fd" value="'+esc(t.to)+'" placeholder="Es. Lisbona o LIS"></label></div>'+
   '<div class="two"><label>Andata<input id="fa" type="date" value="'+esc(t.start)+'"></label><label>Ritorno<input id="fr" type="date" value="'+esc(t.end)+'"></label></div>'+
   '<div class="lk"><button class="btn primary" id="fgo" type="button">Cerca</button><a class="btn" id="fg" target="_blank" rel="noopener" href="#">'+ic("ext")+'Apri su Google Flights</a></div><div id="fout"></div>');
  const upd=()=>$("#fg").href=LK.gflights($("#fo").value||"?",$("#fd").value||"?",$("#fa").value,$("#fr").value);upd();
  ["fo","fd","fa","fr"].forEach(i=>$("#"+i).addEventListener("input",upd));
  $("#fgo").onclick=async()=>{const o=$("#fo").value.trim(),d=$("#fd").value.trim();if(!o||!d){$("#fout").textContent="Inserisci partenza e destinazione.";return}
    $("#fout").textContent="Cerco…";
    try{const p=await mcpCall("search_flights",{origin:o,destination:d,departure_date:$("#fa").value||null,return_date:$("#fr").value||null,adult_count:Math.min(6,t.people.length),query_text:"voli da "+o+" a "+d,user_locale:"it-IT",user_location:null,client_device_info:{device_type:"desktop",agent_name:"ClaudeAI"}});
      showRes($("#fout"),await normalize(p,"f"),"")}
    catch(e){$("#fout").innerHTML='<p>Ricerca integrata non disponibile ('+esc((e&&e.code)||"errore")+'). Usa Google Flights con il pulsante qui sopra.</p>'}};
}
function openHotelSearch(){
  const t=ens(trip());
  modal('<h3>Cerca hotel</h3><label>Dove<input id="hd" value="'+esc(t.to)+'" placeholder="Es. Lisbona, Portogallo"></label>'+
   '<div class="two"><label>Check-in<input id="hi" type="date" value="'+esc(t.start)+'"></label><label>Check-out<input id="ho" type="date" value="'+esc(t.end)+'"></label></div>'+
   '<div class="lk"><button class="btn primary" id="hgo" type="button">Cerca</button><a class="btn" id="hb" target="_blank" rel="noopener" href="#">'+ic("ext")+'Booking</a><a class="btn" id="ht" target="_blank" rel="noopener" href="#">'+ic("ext")+'Tripadvisor</a></div><div id="hout"></div>');
  const upd=()=>{$("#hb").href=LK.booking($("#hd").value);$("#ht").href=LK.trip($("#hd").value+" hotel")};upd();$("#hd").addEventListener("input",upd);
  $("#hgo").onclick=async()=>{const d=$("#hd").value.trim();if(!d)return;$("#hout").textContent="Cerco…";
    try{const p=await mcpCall("search_hotels",{destination:d,check_in_date:$("#hi").value||null,check_out_date:$("#ho").value||null,adult_count:Math.max(1,t.people.length),query_text:"hotel a "+d,user_locale:"it-IT",user_location:null,client_device_info:{device_type:"desktop",agent_name:"ClaudeAI"},limit:6});
      showRes($("#hout"),await normalize(p,"h"),"")}
    catch(e){$("#hout").innerHTML='<p>Ricerca integrata non disponibile ('+esc((e&&e.code)||"errore")+'). Usa i pulsanti Booking o Tripadvisor.</p>'}};
}
/* ---- le mie spese della vacanza ---- */
const cents=n=>Math.round((+String(n).replace(",","."))*100)||0;
const E2=c=>(c/100).toLocaleString("it-IT",{style:"currency",currency:"EUR"});
function balances(t){
  const bal={};t.people.forEach(n=>bal[n]=0);
  t.exp.forEach(e=>{const sp=(e.split&&e.split.length?e.split:t.people).filter(n=>n in bal);if(!sp.length||!(e.who in bal))return;
    bal[e.who]+=e.amt;const q=Math.floor(e.amt/sp.length);let r=e.amt-q*sp.length;sp.forEach(n=>{bal[n]-=q+(r>0?1:0);if(r>0)r--})});
  return bal}
function settle(bal){
  const cr=[],db=[];Object.entries(bal).forEach(([n,v])=>{if(v>0)cr.push([n,v]);else if(v<0)db.push([n,-v])});
  cr.sort((a,b)=>b[1]-a[1]);db.sort((a,b)=>b[1]-a[1]);const out=[];let i=0,j=0;
  while(i<cr.length&&j<db.length){const m=Math.min(cr[i][1],db[j][1]);out.push([db[j][0],cr[i][0],m]);cr[i][1]-=m;db[j][1]-=m;if(!cr[i][1])i++;if(!db[j][1])j++}
  return out}
function renderSpese(){
  const t=ens(trip()),tot=t.exp.reduce((a,e)=>a+e.amt,0),bal=balances(t),st=settle(bal);
  let h='<div class="ph">'+ic("check")+'Le mie spese della vacanza<button class="btn sm primary" id="spAdd" type="button" style="margin-left:auto">'+ic("plus")+'Aggiungi spesa</button></div><div class="sp">';
  h+=t.exp.length?t.exp.slice().reverse().map(e=>'<div class="row"><span><b>'+esc(e.what||"Spesa")+'</b><br><small>'+esc(e.who)+(e.split&&e.split.length&&e.split.length<t.people.length?" · tra "+esc(e.split.join(", ")):" · tra tutti")+'</small></span><span><b>'+E2(e.amt)+'</b> <button class="ibtn" type="button" data-x="'+e.id+'" aria-label="Elimina">×</button></span></div>').join(""):'<div class="empty">Nessuna spesa. Ognuno può aggiungere le proprie.</div>';
  if(t.exp.length){h+='<div class="row"><b>Totale</b><b>'+E2(tot)+'</b></div><div class="row"><span>A testa</span><b>'+E2(Math.round(tot/t.people.length))+'</b></div><div class="bal">'+
    t.people.map(n=>'<div class="row"><span>'+esc(n)+'</span><b class="'+(bal[n]>=0?"pos":"neg")+'">'+(bal[n]>=0?"+":"")+E2(bal[n])+'</b></div>').join("")+'</div>';
    h+='<div class="bal"><b>Per pareggiare</b>'+(st.length?st.map(s=>'<div>'+esc(s[0])+' → '+esc(s[1])+': <b>'+E2(s[2])+'</b></div>').join(""):'<div>Tutto pari.</div>')+'</div>'}
  $("#spese").innerHTML=h+'</div>';
  $("#spAdd").onclick=addExp;
  $("#spese").querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>{t.exp=t.exp.filter(e=>e.id!==b.dataset.x);save();renderSpese()});
}
function addExp(){
  const t=ens(trip());
  modal('<h3>Aggiungi spesa</h3><label>Cosa<input id="xw" placeholder="Es. Cena, taxi, biglietti" maxlength="60"></label>'+
   '<div class="two"><label>Importo (€)<input id="xa" type="text" inputmode="decimal" placeholder="Es. 48,50"></label><label>Chi ha pagato<select id="xp">'+t.people.map(n=>'<option>'+esc(n)+'</option>').join("")+'</select></label></div>'+
   '<label>Divisa tra<div class="chips" id="xs">'+t.people.map(n=>'<label class="chip2"><input type="checkbox" checked value="'+esc(n)+'">'+esc(n)+'</label>').join("")+'</div></label>'+
   '<div class="mfoot"><button class="btn" id="xx" type="button">Annulla</button><button class="btn primary" id="xo" type="button">Aggiungi</button></div>');
  $("#xx").onclick=closeLayer;
  $("#xo").onclick=()=>{const a=cents($("#xa").value);if(a<=0){$("#xa").focus();return}
    const sp=[...document.querySelectorAll("#xs input:checked")].map(i=>i.value);if(!sp.length)return;
    t.exp.push({id:uid(),what:$("#xw").value.trim(),amt:a,who:$("#xp").value,split:sp.length===t.people.length?[]:sp,date:todayIso()});save();closeLayer();renderSpese()};
}
/* ---- mappa strade (Leaflet) + posizione live ---- */
let LM=null,LMK=null,LRT=null,LME=null,streetOn=false,tileOk=0,tileBad=0,me=null,watchId=null;
const zoomOfW=w=>Math.max(2,Math.min(18,Math.round(Math.log2(360/w))));
function lmInit(){
  if(LM||typeof L==="undefined")return !!LM;
  LM=L.map("lmap",{zoomControl:false,attributionControl:true}).setView([42,12],5);
  const tl=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(LM);
  tl.on("tileload",()=>{tileOk++});tl.on("tileerror",()=>{tileBad++;if(!tileOk&&tileBad>=4)lmFail()});
  LM.on("click",e=>{ghost={lat:+e.latlng.lat.toFixed(5),lon:+e.latlng.lng.toFixed(5),name:""};openPlace({lat:ghost.lat,lon:ghost.lon,name:"",sub:"Punto sulla mappa",cat:"altro"},"add")});
  LMK=L.layerGroup().addTo(LM);LRT=L.layerGroup().addTo(LM);return true}
function lmFail(){if(!streetOn)return;setStreet(false);toast("Strade e POI non si caricano in questa pagina (rete bloccata). Funzionano nella versione scaricata.")}
function lmRender(){
  if(!LM||!streetOn)return;LMK.clearLayers();LRT.clearLayers();const pl=trip().places;
  pl.forEach((p,i)=>{const c=p.done?"#1f9d55":(CATS[p.cat]||CATS.altro).c;
    L.marker([p.lat,p.lon],{title:p.name,icon:L.divIcon({className:"",html:'<div class="lpin" style="background:'+c+'">'+(p.done?"✓":i+1)+'</div>',iconSize:[26,26],iconAnchor:[13,13]})})
     .on("click",ev=>{L.DomEvent.stopPropagation(ev);selectPlace(p.id,true)}).bindTooltip(p.name).addTo(LMK)});
  if(state.route){const pts=pl.filter(p=>!p.done).map(p=>[p.lat,p.lon]);if(pts.length>1)L.polyline(pts,{color:trip().color,weight:4,dashArray:"8 7"}).addTo(LRT)}
  lmMe()}
function lmMe(){if(!LM)return;if(LME){LM.removeLayer(LME);LME=null}
  if(me&&streetOn)LME=L.marker([me.lat,me.lon],{icon:L.divIcon({className:"",html:'<div class="me"></div>',iconSize:[16,16],iconAnchor:[8,8]}),interactive:false}).addTo(LM)}
function setStreet(on){
  if(on&&!lmInit()){toast("Mappa stradale non disponibile");return}
  streetOn=on;const mc=$("#mapcard");mc.classList.toggle("street",on);$("#lmap").hidden=!on;$("#zStreet").classList.toggle("on",on);
  if(on){tileOk=0;tileBad=0;LM.invalidateSize();const c=INV(view.cx,view.cy);LM.setView([c.lat,c.lon],zoomOfW(view.w));lmRender();
    setTimeout(()=>{if(streetOn&&!tileOk)lmFail()},5000)}
  else if(LM){const c=LM.getCenter(),z=LM.getZoom();view.cx=MX(c.lng);view.cy=MY(c.lat);view.w=360/Math.pow(2,z);applyView()}
}
$("#zStreet").onclick=()=>setStreet(!streetOn);
$("#zIn").addEventListener("click",()=>{if(streetOn)LM.zoomIn()},true);
$("#zOut").addEventListener("click",()=>{if(streetOn)LM.zoomOut()},true);
$("#zFit").addEventListener("click",()=>{if(streetOn&&LM){const pl=trip().places;if(pl.length)LM.fitBounds(pl.map(p=>[p.lat,p.lon]),{padding:[40,40],maxZoom:15})}},true);
/* i pulsanti originali agiscono sulla mappa vettoriale: in modalità strade non devono muoverla */
["zIn","zOut"].forEach(id=>$("#"+id).addEventListener("click",e=>{if(streetOn)e.stopImmediatePropagation()},true));
{const _rp=renderPins;renderPins=function(){_rp();lmRender();
  if(me&&!streetOn){const L0=mapEl.querySelector("#pinsL");if(L0){const[x,y]=P(me.lat,me.lon),u=unit();
    L0.insertAdjacentHTML("beforeend",'<g transform="translate('+x+' '+y+') scale('+u+')" pointer-events="none"><circle r="16" fill="#1a73e8" opacity=".2"/><circle r="8" fill="#1a73e8" stroke="#fff" stroke-width="3"/></g>')}}}}
{const _fp=flyPlace;flyPlace=function(p,w){if(streetOn&&LM){LM.setView([p.lat,p.lon],Math.max(LM.getZoom(),14))}else _fp(p,w)}}
function locStart(){
  if(!navigator.geolocation){toast("Posizione non supportata da questo browser");return}
  if(watchId!=null){navigator.geolocation.clearWatch(watchId);watchId=null;me=null;$("#zLoc").classList.remove("on");renderPins();toast("Posizione disattivata");return}
  toast("Chiedo la posizione…");
  watchId=navigator.geolocation.watchPosition(pos=>{const first=!me;me={lat:pos.coords.latitude,lon:pos.coords.longitude};$("#zLoc").classList.add("on");
    if(first){if(streetOn&&LM)LM.setView([me.lat,me.lon],15);else{const[x,y]=P(me.lat,me.lon);flyTo(x,y,Math.min(view.w,0.5))}}
    renderPins()},
   err=>{navigator.geolocation.clearWatch(watchId);watchId=null;me=null;$("#zLoc").classList.remove("on");
    toast("Posizione non disponibile qui (permesso o pagina limitata). Funziona nella versione scaricata su HTTPS.")},{enableHighAccuracy:true,maximumAge:5000,timeout:15000});
}
$("#zLoc").onclick=locStart;
window.onThemeChange=()=>{};
/* ---- avvio ---- */
{const _ra=renderAll;renderAll=function(){ens(trip());_ra()}}
applyTheme();renderAll();
$("#zStreet").innerHTML='<svg class="i" viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg>';
