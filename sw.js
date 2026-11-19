// 19/11/2026 (rr-v15): le voci scaricate con «Scarica le voci» stanno nella cache 'rr-v1' (la crea la pagina).
// Prima il service worker le cercava solo nella propria cache (V) e, a ogni aggiornamento, cancellava 'rr-v1':
// le voci non funzionavano mai senza internet. Ora le cerca in tutte le cache e non cancella più 'rr-v1'.
// 19/11/2026 (rr-v16): richieste Range controllate. Un intervallo oltre la fine del file ora riceve 416
// (prima: 206 con «bytes 150-99/100» e lunghezza negativa); un'intestazione non valida riceve il file intero (200).
const V='rr-v16', VOCI='rr-v1';
const SHELL=['./','index.html','en/','en/index.html','manifest.json','en/manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>/^rr-v\d+$/.test(k)&&k!==V&&k!==VOCI).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function ranged(req,res){const r=req.headers.get('range');if(!r)return res;return res.blob().then(b=>{const N=b.size,ct=res.headers.get('Content-Type')||'audio/mpeg';
const full=()=>new Response(b,{status:200,statusText:'OK',headers:{'Content-Type':ct,'Content-Length':String(N),'Accept-Ranges':'bytes'}});
const no=()=>new Response(null,{status:416,statusText:'Range Not Satisfiable',headers:{'Content-Range':`bytes */${N}`,'Accept-Ranges':'bytes'}});
const m=/^bytes=(\d*)-(\d*)$/.exec(r.trim());if(!m||(m[1]===''&&m[2]===''))return full();let s,e;
if(m[1]===''){const k=+m[2];if(k===0||N===0)return no();s=Math.max(0,N-k);e=N-1}
else{s=+m[1];e=m[2]===''?N-1:+m[2];if(m[2]!==''&&e<s)return full();if(s>=N)return no();e=Math.min(e,N-1)}
return new Response(b.slice(s,e+1),{status:206,statusText:'Partial Content',headers:{'Content-Type':ct,'Content-Range':`bytes ${s}-${e}/${N}`,'Content-Length':String(e-s+1),'Accept-Ranges':'bytes'}})})}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;
if(u.pathname.includes('/audio/')){e.respondWith(caches.match(u.href,{ignoreSearch:true}).then(hit=>hit?ranged(req,hit):fetch(req)));return}
e.respondWith(fetch(req).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(req,cp)).catch(()=>{})}return res}).catch(()=>caches.match(req,{ignoreSearch:true}).then(h=>h||caches.match(req.mode==='navigate'?(u.pathname.includes('/en/')?'en/index.html':'index.html'):req))))});
