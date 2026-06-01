"use client";

import Link from "next/link";
import { useEstado } from "@/app/components/contexto";
import { eur } from "@/lib/calculos";
import GraficoMensal from "@/app/components/GraficoMensal";
import Categorias from "@/app/components/Categorias";
import UltimasVendas from "@/app/components/UltimasVendas";

// Página de análise: lucro por sócio (resumo), gráfico mensal, categorias e vendas.
export default function PaginaLucro() {
  const { estado, resumo, categorias, mensal } = useEstado();

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>Lucro por sócio <span className="conta">— acerto de contas na aba <Link href="/socios">Sócios</Link></span></h2>
        <div className="socios-lista">
          <div className="resumo-socio eu">
            <span className="socio-nome">Bubu</span>
            <span className={"socio-lucro " + (resumo.meuLucro < 0 ? "neg" : "pos")}>{eur(resumo.meuLucro)}</span>
          </div>
          {resumo.porSocio.map((s) => (
            <div className="resumo-socio" key={s.id}>
              <span className="socio-nome">{s.nome} <span className="dim pequeno">· {s.pedidos} pedido(s)</span></span>
              <span className={"socio-lucro " + (s.lucro < 0 ? "neg" : "pos")}>{eur(s.lucro)}</span>
            </div>
          ))}
          {resumo.porSocio.length === 0 && <p className="dim pequeno">Sem sócios.</p>}
        </div>
      </section>

      <section className="bloco">
        <h2>Lucro por mês</h2>
        <GraficoMensal dados={mensal} />
      </section>

      <section className="bloco">
        <h2>Lucro por categoria</h2>
        <Categorias categorias={categorias} />
      </section>

      <section className="bloco">
        <h2>Últimas vendas</h2>
        <UltimasVendas pedidos={estado.pedidos} socios={estado.socios} />
      </section>
    </div>
  );
}
