"use client";

import Link from "next/link";
import { useEstado } from "@/app/components/contexto";
import { toNumber } from "@/lib/calculos";
import ResumoCartoes from "@/app/components/ResumoCartoes";
import RelatorioMensal from "@/app/components/RelatorioMensal";
import GraficoMensal from "@/app/components/GraficoMensal";
import ListaParado from "@/app/components/ListaParado";

// Página inicial — visão geral: cartões, este mês, gráfico de lucro, "não vende".
export default function PaginaInicio() {
  const { estado, resumo, relatorio, mensal } = useEstado();
  const diasAlerta = toNumber(estado.config.diasAlerta) || 30;

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

      <div className="inicio-grelha">
        <section className="bloco">
          <h2>Lucro por mês</h2>
          <GraficoMensal dados={mensal} />
        </section>

        <section className="bloco">
          <h2>Não vende <span className="conta">— parados há mais de {diasAlerta} dias</span></h2>
          <ListaParado pedidos={estado.pedidos} diasAlerta={diasAlerta} />
        </section>
      </div>

      <section className="bloco">
        <h2>Atalhos</h2>
        <div className="atalhos">
          <Link href="/pedidos" className="atalho">
            <span className="atalho-icone">▦</span>
            <span className="atalho-texto">
              <span className="atalho-label">Pedidos</span>
              <span className="atalho-sub">{emStock} de {totalItens} itens em stock</span>
            </span>
            <span className="atalho-seta">›</span>
          </Link>
          <Link href="/lucro" className="atalho">
            <span className="atalho-icone">📈</span>
            <span className="atalho-texto">
              <span className="atalho-label">Lucro</span>
              <span className="atalho-sub">gráfico, sócios e categorias</span>
            </span>
            <span className="atalho-seta">›</span>
          </Link>
          <Link href="/contas" className="atalho">
            <span className="atalho-icone">🔑</span>
            <span className="atalho-texto">
              <span className="atalho-label">Contas</span>
              <span className="atalho-sub">abrir o cofre de logins</span>
            </span>
            <span className="atalho-seta">›</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
