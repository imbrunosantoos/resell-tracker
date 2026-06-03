"use client";

import Link from "next/link";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { eur } from "@/lib/calculos";
import GraficoMensal from "@/app/components/GraficoMensal";
import Categorias from "@/app/components/Categorias";
import UltimasVendas from "@/app/components/UltimasVendas";

// Página de análise: lucro por sócio (resumo), gráfico mensal, categorias e vendas.
export default function PaginaLucro() {
  const { estado, resumo, categorias, mensal } = useEstado();
  const { t } = useIdioma();

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>{t("lucro.porSocio")} <span className="conta">— {t("lucro.acertoNaAba")} <Link href="/socios">{t("nav.socios")}</Link>{t("lucro.acertoNaAbaSuf")}</span></h2>
        <div className="socios-lista">
          <div className="resumo-socio eu">
            <span className="socio-nome">{t("lucro.eu")}</span>
            <span className={"socio-lucro " + (resumo.meuLucro < 0 ? "neg" : "pos")}>{eur(resumo.meuLucro)}</span>
          </div>
          {resumo.porSocio.map((s) => (
            <div className="resumo-socio" key={s.id}>
              <span className="socio-nome">{s.nome} <span className="dim pequeno">· {t("lucro.pedidosCount", { n: s.pedidos })}</span></span>
              <span className={"socio-lucro " + (s.lucro < 0 ? "neg" : "pos")}>{eur(s.lucro)}</span>
            </div>
          ))}
          {resumo.porSocio.length === 0 && <p className="dim pequeno">{t("comum.semSocios")}</p>}
        </div>
      </section>

      <section className="bloco">
        <h2>{t("home.lucroPorMes")}</h2>
        <GraficoMensal dados={mensal} />
      </section>

      <section className="bloco">
        <h2>{t("lucro.porCategoria")}</h2>
        <Categorias categorias={categorias} />
      </section>

      <section className="bloco">
        <h2>{t("lucro.ultimasVendas")}</h2>
        <UltimasVendas pedidos={estado.pedidos} socios={estado.socios} />
      </section>
    </div>
  );
}
