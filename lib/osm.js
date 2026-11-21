"use strict";
/* ricerca luoghi (Nominatim) e consigli (Overpass) su dati OpenStreetMap, senza chiavi */
function ocat(x){const c=(x.category||"")+":"+(x.type||"");
  if(/amenity:(restaurant|cafe|bar|pub|fast_food|ice_cream)/.test(c))return"cibo";
  if(/tourism:(hotel|hostel|guest_house|apartment|motel)/.test(c))return"alloggio";
  if(/tourism:|historic:|amenity:(place_of_worship|theatre)/.test(c))return"cultura";
  if(/natural:|leisure:|boundary:national_park/.test(c))return"natura";
  if(/railway:|aeroway:|public_transport:/.test(c))return"trasporti";return"altro"}
async function oSearch(q){
  const r=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=it&q="+encodeURIComponent(q));
  if(!r.ok)throw new Error("net");
  return(await r.json()).map(x=>({name:x.name||x.display_name.split(",")[0],sub:x.display_name,lat:+x.lat,lon:+x.lon,cat:ocat(x),desc:"",cost:0}))}
const OQ={
 vedere:a=>'nwr["tourism"~"attraction|museum|viewpoint|gallery|artwork"]["name"]'+a+';nwr["historic"~"castle|monument|ruins|archaeological_site|church|fort|memorial"]["name"]'+a+';nwr["leisure"~"park|garden"]["name"]'+a+';',
 mangiare:a=>'nwr["amenity"="restaurant"]["name"]'+a+';',
 dormire:a=>'nwr["tourism"~"hotel|guest_house|apartment|hostel"]["name"]'+a+';'};
const OLBL={attraction:"Attrazione",museum:"Museo",viewpoint:"Panorama",gallery:"Galleria",artwork:"Opera",castle:"Castello",monument:"Monumento",ruins:"Rovine",archaeological_site:"Sito archeologico",church:"Chiesa",fort:"Forte",memorial:"Memoriale",park:"Parco",garden:"Giardino",restaurant:"Ristorante",hotel:"Hotel",guest_house:"B&B",apartment:"Appartamento",hostel:"Ostello"};
async function oSuggest(p){
  const c=/\((-?\d+\.?\d*),(-?\d+\.?\d*)\)/.exec(p),kind=/Tipo di suggerimento: ([^.\n]*)/.exec(p)[1];
  const k=/attrazioni/.test(kind)?"vedere":/ristoranti/.test(kind)?"mangiare":"dormire";
  const a='(around:12000,'+c[1]+','+c[2]+')';
  const r=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:"data="+encodeURIComponent('[out:json][timeout:25];('+OQ[k](a)+');out center 120;')});
  if(!r.ok)throw new Error("net");
  const j=await r.json(),seen=new Set();
  const sc=t=>(t.wikipedia?4:0)+(t.wikidata?3:0)+(t.wikimedia_commons?1:0)+(t.website||t["contact:website"]?1:0)+(t.opening_hours?1:0)+(t.stars?+t.stars*.3:0)+(t.heritage?2:0)+(t.cuisine?.5:0)+(t.phone?.3:0);
  return j.elements.filter(e=>e.tags&&e.tags.name&&(e.lat||e.center)).map(e=>({e,s:sc(e.tags)})).sort((x,y)=>y.s-x.s)
   .filter(x=>{const n=x.e.tags.name.toLowerCase();if(seen.has(n))return false;seen.add(n);return true}).slice(0,6).map(({e})=>{
    const t=e.tags,ll=e.center||e,ty=t.tourism||t.historic||t.leisure||t.amenity;
    return{name:t.name,sub:[t["addr:street"],t["addr:city"]].filter(Boolean).join(", "),lat:ll.lat,lon:ll.lon,cat:k==="mangiare"?"cibo":k==="dormire"?"alloggio":(/park|garden/.test(ty)?"natura":"cultura"),
     desc:(OLBL[ty]||"Luogo")+(t.wikipedia||t.wikidata?" · molto noto":"")+(t.cuisine?" · "+t.cuisine.replace(/;/g,", "):""),cost:0}})}
sampleFn={json:async p=>{
  if(/Sei un esperto di viaggi/.test(p))return oSuggest(p);
  const m=/Ricerca dell'utente: "([^"]*)"/.exec(p);if(m)return oSearch(m[1]);
  const e=new Error("n/d");e.code="unavailable";throw e}};
/* online: parte subito con strade e POI */
setTimeout(()=>{try{if(!streetOn)setStreet(true)}catch(e){}},400);
