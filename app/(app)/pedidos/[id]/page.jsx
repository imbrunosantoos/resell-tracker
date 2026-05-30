"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEstado } from "@/app/components/contexto";
import PedidoDetalhe from "@/app/components/PedidoDetalhe";

// Página de um pedido — detalhe grande, com fotos grandes.
export default function PaginaPedido() {
  const { id } = useParams();
  const { estado } = useEstado();
  const pedido = estado.pedidos.find((p) => p.id === id);

  return (
    <div className="pagina">
      <Link href="/pedidos" className="voltar">← Pedidos</Link>
      {pedido ? (
        <PedidoDetalhe pedido={pedido} />
      ) : (
        <div className="vazio">Pedido não encontrado. Pode ter sido apagado.</div>
      )}
    </div>
  );
}
