"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import PedidoDetalhe from "@/app/components/PedidoDetalhe";
import EncomendaDetalhe from "@/app/components/EncomendaDetalhe";

// Página de um pedido — detalhe grande. As encomendas têm uma vista própria.
export default function PaginaPedido() {
  const { id } = useParams();
  const { estado } = useEstado();
  const { t } = useIdioma();
  const pedido = estado.pedidos.find((p) => p.id === id);

  return (
    <div className="pagina">
      <Link href="/pedidos" className="voltar">{t("det.voltar")}</Link>
      {!pedido ? (
        <div className="vazio">{t("det.naoEncontrado")}</div>
      ) : pedido.tipo === "encomenda" ? (
        <EncomendaDetalhe pedido={pedido} />
      ) : (
        <PedidoDetalhe pedido={pedido} />
      )}
    </div>
  );
}
