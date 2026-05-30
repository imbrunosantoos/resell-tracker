"use client";

import Link from "next/link";
import { eur, resumoPedido } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";

// Linha compacta de um pedido na lista. Clica → abre o detalhe. Mostra só o
// essencial: nome, sócio, vendidos/total, investido e lucro.
export default function PedidoLinha({ pedido, socios }) {
  const r = resumoPedido(pedido);
  const socio = socios.find((s) => s.id === pedido.socioId);
  const capa = pedido.itens.find((it) => it.foto)?.foto;
  const inicial = (pedido.nome || "?").trim().charAt(0).toUpperCase();

  return (
    <Link href={`/pedidos/${pedido.id}`} className="pedido-linha">
      <span className="pl-capa" style={capa ? undefined : { background: corCategoria(pedido.nome) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {capa ? <img src={`/api/fotos/${capa}`} alt="" /> : inicial}
      </span>

      <span className="pl-info">
        <span className="pl-nome">{pedido.nome}</span>
        <span className="pl-meta">
          {socio ? <span className="chip">{socio.nome}</span> : <span className="chip solo">Sozinho</span>}
          <span className="pl-dim">{r.vendidos}/{r.total} vendidos</span>
        </span>
      </span>

      <span className="pl-nums">
        <span className="pl-num roxo"><span className="pl-rotulo">Investido</span>{eur(r.investido)}</span>
        <span className="pl-num"><span className="pl-rotulo">Lucro</span>
          <b className={r.lucro > 0 ? "pos" : r.lucro < 0 ? "neg" : ""}>{eur(r.lucro)}</b>
        </span>
      </span>
      <span className="pl-seta">›</span>
    </Link>
  );
}
