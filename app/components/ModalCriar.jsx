"use client";

import { useEffect } from "react";

// Modal largo que embrulha os formulários de criação (novo pedido / nova
// encomenda). Fecha no Escape, no backdrop e no ✕; o conteúdo é o formulário
// existente, sem alterações.
export default function ModalCriar({ titulo, onFechar, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal modal-largo">
        <div className="modal-cab-x">
          <h3>{titulo}</h3>
          <button type="button" className="btn fantasma" onClick={onFechar} aria-label="✕">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
