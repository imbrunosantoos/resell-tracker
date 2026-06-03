"use client";

import Link from "next/link";
import { eur, resumoPedido } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";
import { useIdioma } from "./Idioma";

// Linha compacta de um pedido na lista. Clica → abre o detalhe. Mostra só o
// essencial: nome, sócio, vendidos/total, investido e lucro.
export default function PedidoLinha({ pedido, socios }) {
  const { t } = useIdioma();
  const r = resumoPedido(pedido);
  const socio = socios.find((s) => s.id === pedido.socioId);
  const capa = pedido.itens.find((it) => it.foto)?.foto;
  const inicial = (pedido.nome || "?").trim().charAt(0).toUpperCase();
  const encomenda = pedido.tipo === "encomenda";

  return (
    <Link href={`/pedidos/${pedido.id}`} className="pedido-linha">
      <span className="pl-capa" style={capa ? undefined : { background: corCategoria(pedido.nome) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {capa ? <img src={`/api/fotos/${capa}`} alt="" /> : inicial}
      </span>

      <span className="pl-info">
        <span className="pl-nome">{pedido.nome}</span>
        <span className="pl-meta">
          {encomenda && <span className="chip encomenda">{t("comum.encomenda")}</span>}
          {socio ? <span className="chip">{socio.nome}</span> : <span className="chip solo">{t("filtros.sozinho")}</span>}
          {encomenda ? (
            <span className="pl-dim">{pedido.cliente ? pedido.cliente : t("pl.semCliente")}{pedido.dataPagamento ? ` · ${pedido.dataPagamento}` : ""}</span>
          ) : (
            <span className="pl-dim">{r.vendidos}/{r.total} {t("pl.vendidos")}</span>
          )}
        </span>
      </span>

      <span className="pl-nums">
        <span className="pl-num roxo"><span className="pl-rotulo">{t("resumo.investido")}</span>{eur(r.investido)}</span>
        <span className="pl-num"><span className="pl-rotulo">{t("vendas.lucro")}</span>
          <b className={r.lucro > 0 ? "pos" : r.lucro < 0 ? "neg" : ""}>{eur(r.lucro)}</b>
        </span>
      </span>
      <span className="pl-seta">›</span>
    </Link>
  );
}
