"use client";

import { useState } from "react";
import Link from "next/link";
import { eur, margem, margemPct, estaVendido } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";

// As vendas mais recentes (por data de venda). Filtra por "Eu" (todas as vendas,
// porque participas em todas) ou por um sócio (só as dele). A coluna "Parte" é a
// fatia do lucro de quem está selecionado (lucro÷2 nos pedidos com sócio; lucro
// inteiro a solo, no caso "Eu").
// Com `mes` ('YYYY-MM') mostra só as vendas desse mês (e todas, sem "ver mais").
export default function UltimasVendas({ pedidos, socios = [], limite = 8, mes = null }) {
  const [filtro, setFiltro] = useState("eu"); // "eu" | socioId
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const idsValidos = new Set(socios.map((s) => s.id));
  const socioSel = socios.find((s) => s.id === filtro);

  const vendas = [];
  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      if (!estaVendido(item)) continue;
      if (mes && item.dataVenda.slice(0, 7) !== mes) continue; // só as vendas deste mês
      if (socioSel && pedido.socioId !== filtro) continue; // por sócio: só as dele

      const m = margem(pedido, item);
      const comSocio = pedido.socioId && idsValidos.has(pedido.socioId);
      const parte = socioSel ? m / 2 : comSocio ? m / 2 : m; // dele, ou a minha
      vendas.push({ pedido, item, m, pct: margemPct(pedido, item), parte });
    }
  }
  vendas.sort((a, b) => (a.item.dataVenda < b.item.dataVenda ? 1 : -1));

  const legenda = socioSel
    ? `Vendas com ${socioSel.nome} · "Parte" = metade do lucro dele`
    : `Todas as vendas · "Parte" = a tua fatia do lucro`;

  return (
    <div className="vendas">
      <div className="vendas-topo">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="eu">Eu</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <span className="dim pequeno">{vendas.length} venda(s)</span>
      </div>
      <p className="vendas-legenda">{legenda}</p>

      {vendas.length === 0 ? (
        <p className="dim pequeno">Sem vendas {socioSel ? "com este sócio" : "ainda"}.</p>
      ) : (
        <div className="vendas-lista">
          <div className="vendas-cabecalho">
            <span>Venda</span>
            <span>Preço</span>
            <span>Lucro</span>
            <span>Parte</span>
          </div>
          {(mes || mostrarTodas ? vendas : vendas.slice(0, limite)).map(({ pedido, item, m, pct, parte }) => (
            <Link key={item.id} href={`/pedidos/${pedido.id}`} className="venda-linha">
              <span className="venda-info">
                <span className="venda-dot" style={{ background: corCategoria(item.categoria) }} />
                <span className="venda-textos">
                  <span className="venda-nome">{item.nome || "Item sem nome"}</span>
                  <span className="venda-sub">{pedido.nome} · {item.dataVenda}</span>
                </span>
              </span>
              <span className="venda-preco">{eur(item.precoVenda)}</span>
              <span className={"venda-margem " + (m >= 0 ? "pos" : "neg")}>
                {eur(m)}<small>{pct !== null ? ` ${pct}%` : ""}</small>
              </span>
              <span className="venda-parte">{eur(parte)}</span>
            </Link>
          ))}
          {!mes && vendas.length > limite && (
            <button className="btn mini vendas-mais" onClick={() => setMostrarTodas((v) => !v)}>
              {mostrarTodas ? "Ver menos" : `Ver mais (${vendas.length - limite})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
