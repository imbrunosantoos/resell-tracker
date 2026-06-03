"use client";

import { useEffect, useRef } from "react";
import { useIdioma } from "./Idioma";

// Modal centrado de "tens a certeza?". Fecha no Escape e ao clicar no fundo.
// `perigo` pinta o botão de confirmar a vermelho (apagar/remover).
export default function ModalConfirmar({
  titulo,
  mensagem,
  textoConfirmar,
  perigo = false,
  onConfirmar,
  onFechar,
}) {
  const { t } = useIdioma();
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
          <button type="button" className="btn" onClick={onFechar}>{t("comum.cancelar")}</button>
          <button
            ref={refConfirmar}
            type="button"
            className={"btn " + (perigo ? "perigo" : "primario")}
            onClick={onConfirmar}
          >
            {textoConfirmar || t("comum.confirmar")}
          </button>
        </div>
      </div>
    </div>
  );
}
