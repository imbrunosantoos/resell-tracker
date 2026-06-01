/* Service worker NEUTRALIZADO. Versões anteriores cacheavam páginas e, quando o
   servidor não respondia, serviam lixo da cache — daí a app saltar entre versões
   antigas a cada refresh e, às vezes, abrir o início em vez do pedido.

   Este SW já não faz cache de nada: limpa todas as caches e sai do caminho. O
   ficheiro é mantido só para o browser detetar a mudança e ativar esta versão,
   que apaga as caches envenenadas. O cliente (RegistarSW) ainda o desregista. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Sem handler de "fetch": todos os pedidos vão à rede, como num site normal.
