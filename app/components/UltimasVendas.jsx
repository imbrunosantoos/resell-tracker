"use client";

import { useState } from "react";
import Link from "next/link";
import { eur, margem, margemPct, estaVendido } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";

// As vendas mais recentes (por data de venda). Dá para filtrar por sócio e mostra
// a "Parte" — a fatia do lucro que vem para cada pessoa (lucro÷2 nos pedidos com
// sócio; lucro inteiro a solo). A margem/lucro em si não muda — só se divide.
export default function UltimasVendas({ pedidos, socios = [], limite = 8 }) {
  const [filtro, setFiltro] = useState(""); // "" todos | "solo" | socioId
  const idsValidos = new Set(socios.map((s) => s.id));
  const socioSel = socios.find((s) => s.id === filtro);

  const vendas = [];
  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      if (!estaVendido(item)) continue;
      // filtro por sócio (ao nível do pedido)
      if (filtro === "solo" && pedido.socioId) continue;
      if (filtro && filtro !== "solo" && pedido.socioId !== filtro) continue;

      const m = margem(pedido, item);
      const comSocio = pedido.socioId && idsValidos.has(pedido.socioId);
      // parte: se filtrar por um sócio, mostra a parte dele; senão a minha
      const parte = socioSel ? m / 2 : (comSocio ? m / 2 : m);
      vendas.push({ pedido, item, m, pct: margemPct(pedido, item), parte });
    }
  }
  vendas.sort((a, b) => (a.item.dataVenda < b.item.dataVenda ? 1 : -1));

  const rotuloParte = socioSel ? `Parte de ${socioSel.nome}` : "Para mim";

  return (
    <div className="vendas">
      <div className="vendas-topo">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos os sócios</option>
          <option value="solo">Sozinho</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <span className="dim pequeno">{vendas.length} venda(s)</span>
      </div>

      {vendas.length === 0 ? (
        <p className="dim pequeno">Sem vendas {filtro ? "neste filtro" : "ainda"}.</p>
      ) : (
        <div className="vendas-lista">
          <div className="vendas-cabecalho">
            <span className="venda-info">Venda</span>
            <span className="venda-preco">Preço</span>
            <span className="venda-margem">Lucro</span>
            <span className="venda-parte">{rotuloParte}</span>
          </div>
          {vendas.slice(0, limite).map(({ pedido, item, m, pct, parte }) => (
            <Link key={item.id} href={`/pedidos/${pedido.id}`} className="venda-linha">
              <span className="venda-info">
                <span className="venda-dot" style={{ background: corCategoria(item.categoria) }} />
                <span className="venda-textos">
                  <span className="venda-nome">{item.nome || "Item sem nome"}</span>
                  <span className="venda-sub">{pedido.nome} · {item.dataVenda}</span>
                </span>
              </span>
              <span className="venda-preco">{eur(item.precoVenda)}</span>
              <span className={"venda-margem " + (m >= 0 ? "pos" : "neg")}>{eur(m)}{pct !== null ? ` · ${pct}%` : ""}</span>
              <span className="venda-parte">{eur(parte)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
