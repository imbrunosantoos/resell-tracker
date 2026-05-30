"use client";

import { useEffect } from "react";

// Overlay full-screen para ver uma foto em grande. Fecha no Esc ou clique fora.
export default function Lightbox({ src, alt, onFechar }) {
  useEffect(() => {
    const aoTeclado = (e) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", aoTeclado);
    return () => window.removeEventListener("keydown", aoTeclado);
  }, [onFechar]);

  return (
    <div className="lightbox" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <button className="lightbox-x" onClick={onFechar} title="Fechar">✕</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt || "foto"} />
    </div>
  );
}
