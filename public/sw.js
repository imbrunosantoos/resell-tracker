/* Service worker mínimo e seguro. Objetivo: poder instalar a app (PWA) e abrir
   depressa os ficheiros estáticos. NÃO faz cache de páginas/HTML — a app precisa
   sempre da rede (os dados vêm do servidor), por isso servir uma página em cache
   só dava versões velhas ou, pior, mandava o utilizador para o sítio errado.

   Regra de ouro: uma navegação para /pedidos/X é sempre a rede. Nunca a
   substituímos por outra página (foi isso que antes mandava alguns pedidos para
   o início). */

const CACHE = "resell-v3";
const ESTATICOS = ["/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESTATICOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  // Apaga caches antigas (ex.: resell-v2, que guardava páginas e tinha o
  // fallback para "/") — assim os deep-links voltam a funcionar.
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  const url = new URL(request.url);

  // Só GET e só mesma origem; a API nunca passa pela cache.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navegações (abrir páginas) e dados RSC do Next → sempre rede, sem fallback
  // para outra página. Offline, deixamos falhar como num browser normal.
  if (request.mode === "navigate" || request.headers.get("RSC") === "1") return;

  // Estáticos com hash no nome (/_next/static/...) e a casca → cache-first.
  if (url.pathname.startsWith("/_next/static/") || ESTATICOS.includes(url.pathname)) {
    evento.respondWith(
      caches.match(request).then(
        (emCache) =>
          emCache ||
          fetch(request).then((resposta) => {
            const copia = resposta.clone();
            caches.open(CACHE).then((c) => c.put(request, copia)).catch(() => {});
            return resposta;
          })
      )
    );
  }
  // Tudo o resto: deixa o browser tratar normalmente (rede).
});
