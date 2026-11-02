const C = "rkbeta2";
const SHELL = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => Promise.all(
    SHELL.map(u => c.add(u).catch(() => {}))
  )).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== C) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const url = new URL(r.url);
  if (url.origin !== location.origin) return;
  if (r.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html")) {
    e.respondWith((async () => {
      try{
        const n = await fetch(r);
        (await caches.open(C)).put(r, n.clone()).catch(() => {});
        return n;
      }catch(_){
        return (await caches.match(r)) || (await caches.match("./index.html")) ||
               new Response("Offline", { status: 503 });
      }
    })());
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(n => {
    const cp = n.clone();
    caches.open(C).then(c => c.put(r, cp)).catch(() => {});
    return n;
  }).catch(() => new Response("", { status: 504 }))));
});