"use strict";
/* ===== impostazioni: chiavi salvate + backup ===== */
(function(){
  const g=k=>{try{return localStorage.getItem(k)||""}catch(e){return""}},s=(k,v)=>{try{v?localStorage.setItem(k,v):localStorage.removeItem(k)}catch(e){}};
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  /* link di configurazione: importa le chiavi una volta e le toglie dall'indirizzo */
  try{const m=/[#&]cfg=([^&]+)/.exec(location.hash);if(m){const c=JSON.parse(decodeURIComponent(escape(atob(m[1]))));if(c.adbkey)s("adbkey",c.adbkey);history.replaceState(null,"",location.pathname+location.search)}}catch(e){}
  const seg=document.getElementById("themeSeg");
  if(seg)seg.insertAdjacentHTML("beforebegin",'<button class="btn" id="setBtn" type="button" title="Impostazioni" style="margin-right:8px"><svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>');
  function open(){
    const has=!!g("adbkey");
    modal('<h3>Impostazioni</h3>'+
     '<label>Chiave AeroDataBox (ricerca voli)<input id="sk" type="password" autocomplete="off" placeholder="'+(has?"Salvata · scrivi per cambiarla":"Incolla la chiave RapidAPI")+'"></label>'+
     '<p class="hint" id="sm">'+(has?"Chiave salvata in questo browser.":"Nessuna chiave salvata.")+'</p>'+
     '<div class="lk"><button class="btn primary" id="ss" type="button">Salva</button><button class="btn" id="sc" type="button">Copia link per altri dispositivi</button></div>'+
     '<p class="hint">Il link contiene la chiave: aprendolo su un altro browser o telefono la salva da solo. Non condividerlo.</p>'+
     '<h4 style="margin:14px 0 6px;font-family:var(--display)">Backup dei viaggi</h4>'+
     '<div class="lk"><button class="btn" id="se" type="button">Esporta</button><label class="btn" style="cursor:pointer">Importa<input id="si" type="file" accept="application/json" hidden></label></div>'+
     '<div class="mfoot"><button class="btn primary" id="sx" type="button">Chiudi</button></div>');
    $("#sx").onclick=closeLayer;
    $("#ss").onclick=()=>{const v=$("#sk").value.trim();if(v){s("adbkey",v);$("#sk").value="";$("#sk").placeholder="Salvata · scrivi per cambiarla";$("#sm").textContent="Chiave salvata in questo browser."}else $("#sm").textContent=g("adbkey")?"Nessuna modifica.":"Incolla prima la chiave."};
    $("#sc").onclick=async()=>{const k=g("adbkey");if(!k){$("#sm").textContent="Salva prima la chiave.";return}
      const u=location.origin+location.pathname+"#cfg="+btoa(unescape(encodeURIComponent(JSON.stringify({adbkey:k}))));
      try{await navigator.clipboard.writeText(u);$("#sm").textContent="Link copiato."}catch(e){$("#sm").textContent="Copia non riuscita."}};
    $("#se").onclick=()=>{const b=new Blob([JSON.stringify(state)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="planner-viaggi-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
    $("#si").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!d.trips||!d.trips.length)throw 0;state.trips=d.trips;state.active=d.active||d.trips[0].id;state.trips.forEach(ens);save();closeLayer();renderAll();fit(true);toast("Backup importato")}catch(x){$("#sm").textContent="File non valido."}};
  }
  const b=document.getElementById("setBtn");if(b)b.onclick=open;
})();
