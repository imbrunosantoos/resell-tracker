"use client";

import Link from "next/link";
import { useEstado } from "@/app/components/contexto";
import { eur } from "@/lib/calculos";
import ResumoCartoes from "@/app/components/ResumoCartoes";
import RelatorioMensal from "@/app/components/RelatorioMensal";

// Página inicial — resumo com pouca informação: cartões + "Este mês" + atalhos.
export default function PaginaInicio() {
  const { estado, resumo, relatorio } = useEstado();

  const totalItens = estado.pedidos.reduce((n, p) => n + p.itens.length, 0);
  const emStock = estado.pedidos.reduce(
    (n, p) => n + p.itens.filter((it) => !(Number(it.precoVenda) > 0 && it.dataVenda)).length, 0);

  return (
    <div className="pagina">
      <ResumoCartoes resumo={resumo} />

      <section className="bloco">
        <h2>Este mês</h2>
        <RelatorioMensal relatorio={relatorio} />
      </section>

      <section className="bloco">
        <h2>Atalhos</h2>
        <div className="atalhos">
          <Link href="/pedidos" className="atalho">
            <span className="atalho-num">{estado.pedidos.length}</span>
            <span className="atalho-label">Pedidos</span>
            <span className="atalho-sub">{emStock} de {totalItens} itens em stock</span>
          </Link>
          <Link href="/lucro" className="atalho">
            <span className="atalho-num">{eur(resumo.lucroReal)}</span>
            <span className="atalho-label">Lucro real</span>
            <span className="atalho-sub">ver gráfico e categorias</span>
          </Link>
          <Link href="/contas" className="atalho">
            <span className="atalho-num">{estado.credenciais.length}</span>
            <span className="atalho-label">Contas</span>
            <span className="atalho-sub">logins guardados</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
