"use client";

import { useEffect, useRef, useState } from "react";
import { eur } from "@/lib/calculos";

// Modal pequeno para marcar um item como vendido de uma vez: preço + data.
// Sugere já o preço mínimo (para a margem desejada) e a data de hoje.
export default function ModalVenda({ item, sugestao, onConfirmar, onFechar }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [preco, setPreco] = useState(
    item.precoVenda ? String(item.precoVenda) : sugestao ? sugestao.toFixed(2) : ""
  );
  const [data, setData] = useState(item.dataVenda || hoje);
  const refPreco = useRef(null);

  useEffect(() => {
    refPreco.current?.focus();
    refPreco.current?.select();
    const aoTeclado = (e) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", aoTeclado);
    return () => window.removeEventListener("keydown", aoTeclado);
  }, [onFechar]);

  function confirmar(e) {
    e.preventDefault();
    if (!preco || !data) return;
    onConfirmar(preco, data);
  }

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal" onSubmit={confirmar}>
        <h3>Marcar como vendido</h3>
        <p className="sub">{item.nome || "Item sem nome"}</p>

        <div className="campos">
          <label className="campo">
            <span>Preço de venda (€)</span>
            <input
              ref={refPreco} className="num" type="number" step="0.01"
              value={preco} onChange={(e) => setPreco(e.target.value)}
            />
          </label>
          <label className="campo">
            <span>Data da venda</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </label>
          {sugestao !== null && (
            <span className="dica">preço mínimo sugerido: {eur(sugestao)}</span>
          )}
        </div>

        <div className="acoes">
          <button type="button" className="btn" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn primario">Confirmar venda</button>
        </div>
      </form>
    </div>
  );
}
