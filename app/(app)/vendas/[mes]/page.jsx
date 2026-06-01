"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEstado } from "@/app/components/contexto";
import { nomeMes } from "@/lib/calculos";
import UltimasVendas from "@/app/components/UltimasVendas";

// Vendas de um mês específico (YYYY-MM). Chega-se aqui pelos cartões do início.
export default function PaginaVendasMes() {
  const { mes } = useParams();
  const { estado } = useEstado();

  return (
    <div className="pagina">
      <Link href="/" className="voltar">← Início</Link>
      <section className="bloco">
        <h2>Vendas de <span className="mes-titulo">{nomeMes(mes)}</span></h2>
        <UltimasVendas pedidos={estado.pedidos} socios={estado.socios} mes={mes} />
      </section>
    </div>
  );
}
