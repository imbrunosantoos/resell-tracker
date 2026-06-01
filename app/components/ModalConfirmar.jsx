"use client";

import { useEffect, useRef } from "react";

// Modal centrado de "tens a certeza?". Fecha no Escape e ao clicar no fundo.
// `perigo` pinta o botão de confirmar a vermelho (apagar/remover).
export default function ModalConfirmar({
  titulo,
  mensagem,
  textoConfirmar = "Confirmar",
  perigo = false,
  onConfirmar,
  onFechar,
}) {
  const refConfirmar = useRef(null);

  useEffect(() => {
    refConfirmar.current?.focus();
    const aoTeclado = (e) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", aoTeclado);
    return () => window.removeEventListener("keydown", aoTeclado);
  }, [onFechar]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal" role="alertdialog" aria-modal="true">
        <h3>{titulo}</h3>
        {mensagem && <p className="sub">{mensagem}</p>}
        <div className="acoes">
          <button type="button" className="btn" onClick={onFechar}>Cancelar</button>
          <button
            ref={refConfirmar}
            type="button"
            className={"btn " + (perigo ? "perigo" : "primario")}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
