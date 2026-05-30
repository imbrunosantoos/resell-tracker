"use client";

import Link from "next/link";
import { eur, margem, margemPct, estaVendido } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";

// As vendas mais recentes (por data de venda), com a margem de cada uma.
export default function UltimasVendas({ pedidos, limite = 8 }) {
  const vendas = [];
  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      if (!estaVendido(item)) continue;
      vendas.push({ pedido, item, m: margem(pedido, item), pct: margemPct(pedido, item) });
    }
  }
  vendas.sort((a, b) => (a.item.dataVenda < b.item.dataVenda ? 1 : -1));

  if (vendas.length === 0) {
    return <p className="dim pequeno">Ainda sem vendas. Marca a primeira num pedido.</p>;
  }

  return (
    <div className="vendas-lista">
      {vendas.slice(0, limite).map(({ pedido, item, m, pct }) => (
        <Link key={item.id} href={`/pedidos/${pedido.id}`} className="venda-linha">
          <span className="venda-dot" style={{ background: corCategoria(item.categoria) }} />
          <span className="venda-info">
            <span className="venda-nome">{item.nome || "Item sem nome"}</span>
            <span className="venda-sub">{pedido.nome} · {item.dataVenda}</span>
          </span>
          <span className="venda-preco">{eur(item.precoVenda)}</span>
          <span className={"venda-margem " + (m >= 0 ? "pos" : "neg")}>{eur(m)}{pct !== null ? ` · ${pct}%` : ""}</span>
        </Link>
      ))}
    </div>
  );
}
