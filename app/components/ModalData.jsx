"use client";

import { useEffect, useRef, useState } from "react";
import { useIdioma } from "./Idioma";

// Modal pequeno e reutilizável para escolher uma data (ex.: data em que o
// dinheiro de uma venda caiu). Pré-preenchido com `dataInicial` (ou hoje).
export default function ModalData({ titulo, sub, dataInicial, rotulo, onConfirmar, onFechar }) {
  const { t } = useIdioma();
  const hoje = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(dataInicial || hoje);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    const aoTeclado = (e) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", aoTeclado);
    return () => window.removeEventListener("keydown", aoTeclado);
  }, [onFechar]);

  function confirmar(e) {
    e.preventDefault();
    if (!data) return;
    onConfirmar(data);
  }

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal" onSubmit={confirmar}>
        <h3>{titulo}</h3>
        {sub && <p className="sub">{sub}</p>}
        <div className="campos">
          <label className="campo">
            <span>{rotulo}</span>
            <input ref={ref} type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
        </div>
        <div className="acoes">
          <button type="button" className="btn" onClick={onFechar}>{t("comum.cancelar")}</button>
          <button type="submit" className="btn primario">{t("comum.confirmar")}</button>
        </div>
      </form>
    </div>
  );
}
