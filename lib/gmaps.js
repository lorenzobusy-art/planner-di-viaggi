"use strict";
/* ===== Google Maps al posto di Leaflet ===== */
const GKEY="gmkey";let GM=null,GMK=[],GRT=null,GME=null,gLoading=null;
const DARKS=[{elementType:"geometry",stylers:[{color:"#1d2a45"}]},{elementType:"labels.text.fill",stylers:[{color:"#9fb0d0"}]},{elementType:"labels.text.stroke",stylers:[{color:"#0b1220"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#0b1830"}]},{featureType:"road",elementType:"geometry",stylers:[{color:"#34527e"}]},{featureType:"poi",elementType:"geometry",stylers:[{color:"#22324f"}]},{featureType:"administrative",elementType:"geometry.stroke",stylers:[{color:"#3a4d70"}]}];
const gkey=()=>{try{return localStorage.getItem(GKEY)||""}catch(e){return""}};
function loadG(key){
  if(gLoading)return gLoading;
  gLoading=new Promise((res,rej)=>{window.__gm=async()=>{try{await google.maps.importLibrary("maps");await google.maps.importLibrary("marker");await google.maps.importLibrary("places");res()}catch(e){rej(e)}};
    window.gm_authFailure=()=>{toast("Chiave Google non valida o API non abilitate. Controlla la chiave.");try{localStorage.removeItem(GKEY)}catch(e){}if(GM){streetOn&&setStreet(false)}};
    const s=document.createElement("script");s.src="https://maps.googleapis.com/maps/api/js?key="+encodeURIComponent(key)+"&loading=async&language=it&callback=__gm";s.onerror=()=>{gLoading=null;rej(new Error("load"))};document.head.appendChild(s)});
  return gLoading}
function lmInit(){return !!GM}
async function gStart(){
  const k=gkey();if(!k){askKey();return}
  try{toast("Carico Google Maps…");await loadG(k)}catch(e){toast("Google Maps non si carica: controlla la chiave e la connessione");return}
  const c=INV(view.cx,view.cy);
  const map=new google.maps.Map($("#lmap"),{center:{lat:c.lat,lng:c.lng},zoom:zoomOfW(view.w),disableDefaultUI:true,zoomControl:false,gestureHandling:"greedy",clickableIcons:true,styles:effTheme()==="dark"?DARKS:null});
  GM=map;tileOk=1;
  LM={setView(p,z){map.setCenter({lat:p[0],lng:p[1]});map.setZoom(z)},invalidateSize(){google.maps.event.trigger(map,"resize")},zoomIn(){map.setZoom(map.getZoom()+1)},zoomOut(){map.setZoom(map.getZoom()-1)},getZoom(){return map.getZoom()},
    getCenter(){const q=map.getCenter();return{lat:q.lat(),lng:q.lng()}},
    fitBounds(pts,o){const b=new google.maps.LatLngBounds();pts.forEach(p=>b.extend({lat:p[0],lng:p[1]}));map.fitBounds(b,40);google.maps.event.addListenerOnce(map,"idle",()=>{if(map.getZoom()>15)map.setZoom(15)})}};
  map.addListener("click",async e=>{
    if(e.placeId){e.stop();try{const pl=new google.maps.places.Place({id:e.placeId});await pl.fetchFields({fields:["displayName","formattedAddress","location","types"]});
      const lat=pl.location.lat(),lon=pl.location.lng();ghost={lat,lon,name:pl.displayName};openPlace({lat,lon,name:pl.displayName,sub:pl.formattedAddress||"",cat:gcat(pl.types)},"add");return}catch(x){}}
    ghost={lat:+e.latLng.lat().toFixed(5),lon:+e.latLng.lng().toFixed(5),name:""};openPlace({lat:ghost.lat,lon:ghost.lon,name:"",sub:"Punto sulla mappa",cat:"altro"},"add")});
  setStreet(true);
}
function gcat(t){t=t||[];const h=x=>t.some(y=>x.includes(y));
  if(h(["restaurant","cafe","bar","bakery","food"]))return"cibo";if(h(["lodging","hotel"]))return"alloggio";
  if(h(["museum","church","place_of_worship","tourist_attraction","art_gallery","historical"]))return"cultura";
  if(h(["park","natural_feature","campground","beach"]))return"natura";if(h(["airport","train_station","transit_station"]))return"trasporti";return"altro"}
function lmRender(){
  if(!GM||!streetOn)return;GMK.forEach(m=>m.setMap(null));GMK=[];if(GRT){GRT.setMap(null);GRT=null}const pl=trip().places;
  pl.forEach((p,i)=>{const c=p.done?"#1f9d55":(CATS[p.cat]||CATS.altro).c;
    const m=new google.maps.Marker({map:GM,position:{lat:p.lat,lng:p.lon},title:p.name,label:{text:p.done?"✓":String(i+1),color:"#fff",fontWeight:"700",fontSize:"12px"},icon:{path:google.maps.SymbolPath.CIRCLE,scale:14,fillColor:c,fillOpacity:1,strokeColor:"#fff",strokeWeight:2.5}});
    m.addListener("click",()=>selectPlace(p.id,true));GMK.push(m)});
  if(state.route){const pts=pl.filter(p=>!p.done).map(p=>({lat:p.lat,lng:p.lon}));if(pts.length>1)GRT=new google.maps.Polyline({map:GM,path:pts,strokeColor:trip().color,strokeWeight:4,strokeOpacity:.9})}
  lmMe()}
function lmMe(){if(!GM)return;if(GME){GME.setMap(null);GME=null}
  if(me&&streetOn)GME=new google.maps.Marker({map:GM,position:{lat:me.lat,lng:me.lon},clickable:false,zIndex:999,icon:{path:google.maps.SymbolPath.CIRCLE,scale:9,fillColor:"#1a73e8",fillOpacity:1,strokeColor:"#fff",strokeWeight:3}})}
function lmFail(){}
window.onThemeChange=()=>{if(GM)GM.setOptions({styles:effTheme()==="dark"?DARKS:null})};
$("#zStreet").onclick=()=>{if(!GM){gStart();return}setStreet(!streetOn)};
$("#zStreet").title="Mappa Google (strade e POI)";
function askKey(){
  modal('<h3>Chiave Google Maps</h3><p class="hint">Crea la chiave su console.cloud.google.com (API: Maps JavaScript e Places API New) e limitala a questo sito. Resta salvata solo in questo browser.</p><label>Chiave API<input id="gk" placeholder="AIza…" autocomplete="off"></label><div class="mfoot"><button class="btn" id="gx" type="button">Annulla</button><button class="btn primary" id="go" type="button">Salva e attiva</button></div>');
  $("#gx").onclick=closeLayer;$("#go").onclick=()=>{const v=$("#gk").value.trim();if(!v)return;try{localStorage.setItem(GKEY,v)}catch(e){}closeLayer();gStart()}}
/* ricerca luoghi con Google Places */
sampleFn={json:async p=>{
  if(/Sei un esperto di viaggi/.test(p))return gSuggest(p);
  const m=/Ricerca dell'utente: "([^"]*)"/.exec(p);if(!m){const e=new Error("n/d");e.code="unavailable";throw e}
  if(!window.google||!google.maps||!google.maps.places)throw new Error("nokey");
  const{Place}=google.maps.places;const r=await Place.searchByText({textQuery:m[1],fields:["displayName","formattedAddress","location","types"],maxResultCount:5,language:"it"});
  return r.places.map(x=>({name:x.displayName,sub:x.formattedAddress||"",lat:x.location.lat(),lon:x.location.lng(),cat:gcat(x.types),desc:"",cost:0}))}};
if(gkey())gStart();

/* suggerimenti furbi: Google Places, ordinati per qualità reale (voto x numero di recensioni) */
const PT={vedere:["tourist_attraction","museum","historical_landmark","park","church","art_gallery"],mangiare:["restaurant"],dormire:["lodging"]};
const EUR={PRICE_LEVEL_INEXPENSIVE:"€",PRICE_LEVEL_MODERATE:"€€",PRICE_LEVEL_EXPENSIVE:"€€€",PRICE_LEVEL_VERY_EXPENSIVE:"€€€€"};
async function gSuggest(p){
  if(!window.google||!google.maps||!google.maps.places)throw new Error("nokey");
  const c=/\((-?\d+\.?\d*),(-?\d+\.?\d*)\)/.exec(p),kind=/Tipo di suggerimento: ([^.\n]*)/.exec(p)[1];
  const k=/attrazioni/.test(kind)?"vedere":/ristoranti/.test(kind)?"mangiare":"dormire";
  const{Place,SearchNearbyRankPreference}=google.maps.places;
  const r=await Place.searchNearby({fields:["displayName","formattedAddress","location","types","rating","userRatingCount","priceLevel","editorialSummary"],
    locationRestriction:{center:{lat:+c[1],lng:+c[2]},radius:15000},includedPrimaryTypes:PT[k],maxResultCount:20,rankPreference:SearchNearbyRankPreference.POPULARITY,language:"it"});
  const sc=x=>(x.rating||0)*Math.log(1+(x.userRatingCount||0));
  return r.places.filter(x=>(x.rating||0)>=4.2&&(x.userRatingCount||0)>=40).sort((a,b)=>sc(b)-sc(a)).slice(0,6).map(x=>({
    name:x.displayName,sub:x.formattedAddress||"",lat:x.location.lat(),lon:x.location.lng(),cat:gcat(x.types),
    desc:"★"+x.rating.toFixed(1)+" · "+x.userRatingCount.toLocaleString("it-IT")+" recensioni"+(EUR[x.priceLevel]?" · "+EUR[x.priceLevel]:"")+(x.editorialSummary?" · "+x.editorialSummary:""),cost:0}))}
