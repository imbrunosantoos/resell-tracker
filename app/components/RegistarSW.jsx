"use client";

import { useEffect } from "react";

// Já NÃO usamos service worker. As versões antigas cacheavam páginas e faziam a
// app abrir versões desatualizadas/misturadas a cada refresh. Aqui desregistamos
// qualquer SW que ainda exista e limpamos as caches, para a app carregar sempre
// a versão atual diretamente da rede (como um site normal).
export default function RegistarSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations?.()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
    if (window.caches?.keys) {
      caches.keys().then((chaves) => chaves.forEach((k) => caches.delete(k))).catch(() => {});
    }
  }, []);
  return null;
}
