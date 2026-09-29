/* Analítica Umami (sin cookies). Solo se activa si _config.js trae UMAMI_SRC y UMAMI_WEBSITE_ID.
   Uso en las páginas: fotonTrack('evento', {dato:'valor'}). Nunca mandar PIN ni datos de pedido. */
(function(){
  var c=window.FOTON_CONFIG||{}, cola=[];
  window.fotonTrack=function(n,d){
    try{ if(window.umami&&umami.track) umami.track(n,d); else if(cola.length<50) cola.push([n,d]); }catch(e){}
  };
  if(!c.UMAMI_SRC||!c.UMAMI_WEBSITE_ID) return;
  var s=document.createElement('script');
  s.defer=true; s.src=c.UMAMI_SRC;
  s.setAttribute('data-website-id',c.UMAMI_WEBSITE_ID);
  s.setAttribute('data-exclude-search','true');
  s.setAttribute('data-exclude-hash','true');
  if(c.UMAMI_DOMAINS) s.setAttribute('data-domains',c.UMAMI_DOMAINS);
  s.onload=function(){ var x; while((x=cola.shift())) window.fotonTrack(x[0],x[1]); };
  document.head.appendChild(s);
})();
