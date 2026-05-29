"use client";

import { useEffect } from "react";

// Regista o service worker para a app poder ser instalada no telemóvel (PWA).
// Só corre em produção — em dev o SW só atrapalha o hot-reload.
export default function RegistarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sem rede ou sem suporte: a app continua a funcionar, só não instala */
    });
  }, []);
  return null;
}
