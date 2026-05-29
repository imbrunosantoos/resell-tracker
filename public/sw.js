/* Service worker mínimo: guarda a "casca" da app em cache para abrir depressa
   e, se estiveres offline, mostrar pelo menos a interface. Os dados em si vêm
   sempre do servidor (a rede é precisa para os ler e gravar). */

const CACHE = "resell-v2";
const CASCA = ["/", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;

  // Pedidos à API e mutações nunca são servidos da cache.
  if (request.method !== "GET" || new URL(request.url).pathname.startsWith("/api/")) return;

  // Rede primeiro; se falhar (offline), tenta a cache.
  evento.respondWith(
    fetch(request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE).then((c) => c.put(request, copia)).catch(() => {});
        return resposta;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match("/")))
  );
});
