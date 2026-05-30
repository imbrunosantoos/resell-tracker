"use client";

import Link from "next/link";
import { eur, custoReal, diasEmStock, estaVendido } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";

// Itens parados há mais de `diasAlerta` dias (não vendem). Acionável: link ao
// pedido para baixares o preço ou rever. Mostra os mais parados primeiro.
export default function ListaParado({ pedidos, diasAlerta, limite = 6 }) {
  const parados = [];
  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      if (estaVendido(item)) continue;
      const dias = diasEmStock(pedido, item);
      if (dias !== null && dias > diasAlerta) {
        parados.push({ pedido, item, dias, custo: custoReal(pedido, item) });
      }
    }
  }
  parados.sort((a, b) => b.dias - a.dias);

  if (parados.length === 0) {
    return <p className="dim pequeno">Nada parado há muito tempo. Tudo a rodar 👌</p>;
  }

  const mostrar = parados.slice(0, limite);

  return (
    <div className="parado-lista">
      {mostrar.map(({ pedido, item, dias, custo }) => (
        <Link key={item.id} href={`/pedidos/${pedido.id}`} className="parado-linha">
          <span className="parado-capa" style={item.foto ? undefined : { background: corCategoria(item.categoria) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {item.foto ? <img src={`/api/fotos/${item.foto}`} alt="" /> : (item.nome || "?").charAt(0).toUpperCase()}
          </span>
          <span className="parado-info">
            <span className="parado-nome">{item.nome || "Item sem nome"}</span>
            <span className="parado-sub">{pedido.nome}{item.categoria ? ` · ${item.categoria}` : ""}</span>
          </span>
          <span className="parado-nums">
            <span className="badge">⏳ {dias}d</span>
            <span className="parado-custo">{eur(custo)}</span>
          </span>
        </Link>
      ))}
      {parados.length > limite && (
        <Link href="/pedidos" className="parado-todos">+ {parados.length - limite} — ver em Pedidos</Link>
      )}
    </div>
  );
}
