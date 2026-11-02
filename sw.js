/* Kitaplığım service worker: uygulama kabuğu önbellekte, veri ağdan (çevrimdışıysa önbellekten), kapaklar önbellekten. */
const SHELL = "kitapligim-shell-v1";
const COVERS = "kitapligim-covers-v1";
const COVER_LIMIT = 700;
const ASSETS = ["./", "index.html", "styles.css", "app.js", "manifest.webmanifest", "data/books.json",
  "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, COVERS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(SHELL);
  const cached = await cache.match(req, { ignoreSearch: true });
  const fresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
  return cached || fresh;
}

async function coverFirst(req) {
  const cache = await caches.open(COVERS);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") {
    await cache.put(req, res.clone());
    const keys = await cache.keys();
    if (keys.length > COVER_LIMIT) await Promise.all(keys.slice(0, keys.length - COVER_LIMIT).map((k) => cache.delete(k)));
  }
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.endsWith("/data/books.json") || req.mode === "navigate") e.respondWith(networkFirst(req));
    else e.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (req.destination === "image") e.respondWith(coverFirst(req).catch(() => Response.error()));
});
