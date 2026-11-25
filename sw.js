const CACHE="wallet-v2",FILES=["./","./index.html","./manifest.json","./extras.js","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>0)))));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!=="shared").map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method==="POST"&&u.pathname.endsWith("/share-target")){
    e.respondWith((async()=>{
      try{const fd=await e.request.formData(),f=fd.get("slip");
        if(f){const c=await caches.open("shared");await c.put("slip",new Response(f,{headers:{"Content-Type":f.type||"image/jpeg"}}))}}catch(_){}
      return Response.redirect(new URL("./index.html?shared=1",self.registration.scope).href,303);
    })());return;
  }
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
