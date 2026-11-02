const V='rr-v1';
const SHELL=['./','index.html','en/','en/index.html','manifest.json','en/manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function ranged(req,res){const r=req.headers.get('range');if(!r)return res;return res.blob().then(b=>{const m=/bytes=(\d*)-(\d*)/.exec(r);if(!m)return res;let s,e;if(m[1]===''&&m[2]!==''){s=Math.max(0,b.size-(+m[2]));e=b.size-1}else{s=m[1]?+m[1]:0;e=m[2]?+m[2]:b.size-1}e=Math.min(e,b.size-1);return new Response(b.slice(s,e+1),{status:206,statusText:'Partial Content',headers:{'Content-Type':'audio/mpeg','Content-Range':`bytes ${s}-${e}/${b.size}`,'Content-Length':String(e-s+1)}})})}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;
if(u.pathname.includes('/audio/')){e.respondWith(caches.open(V).then(c=>c.match(u.href).then(hit=>hit?ranged(req,hit):fetch(req))));return}
e.respondWith(fetch(req).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(req,cp)).catch(()=>{})}return res}).catch(()=>caches.match(req,{ignoreSearch:true}).then(h=>h||caches.match(req.mode==='navigate'?(u.pathname.includes('/en/')?'en/index.html':'index.html'):req))))});
