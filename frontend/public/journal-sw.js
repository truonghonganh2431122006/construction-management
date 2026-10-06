/* Offline application shell only. Authenticated API and Vite development files stay out of caches. */
const CACHE_PREFIX = "xds-journal-shell-";
const CACHE = `${CACHE_PREFIX}v3`;
const SHELL_ROUTES = ["/", "/site-journal"];
const VITE_PATHS = ["/node_modules/", "/@vite/", "/@react-refresh", "/@fs/", "/@id/", "/src/", "/__vite", "/__open-in-editor"];
const HASHED_PRODUCTION_ASSET = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/;

function isViteOrSourcePath(pathname) {
  return VITE_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
      const cache = await caches.open(CACHE);
      await cache.put(request,response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request) || await caches.match("/site-journal") || await caches.match("/");
    return cached || new Response("Ứng dụng chưa được lưu để sử dụng ngoại tuyến.",{
      status:503,headers:{ "Content-Type":"text/plain; charset=utf-8" }
    });
  }
}

async function productionAssetResponse(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request,response.clone());
    }
    return response;
  } catch {
    return await caches.match(request) || new Response("Asset unavailable offline",{
      status:503,headers:{ "Content-Type":"text/plain; charset=utf-8" }
    });
  }
}

self.addEventListener("install",(event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL_ROUTES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate",(event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch",(event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isViteOrSourcePath(url.pathname)) return;
  if (/^\/(auth|projects)(\/|$)/.test(url.pathname)) return;
  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }
  const isProductionAsset = HASHED_PRODUCTION_ASSET.test(url.pathname) && ["script","style","font","image"].includes(request.destination);
  if (isProductionAsset) event.respondWith(productionAssetResponse(request));
});
