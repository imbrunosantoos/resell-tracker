"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { eur, lucroPorModelo } from "@/lib/calculos";
import GraficoMensal from "@/app/components/GraficoMensal";
import Categorias from "@/app/components/Categorias";
import UltimasVendas from "@/app/components/UltimasVendas";

// Página de análise em grelha: gráfico mensal (principal) + lucro por sócio
// (lateral); por baixo, por modelo e por categoria lado a lado; últimas vendas
// a toda a largura.
export default function PaginaLucro() {
  const { estado, resumo, categorias, mensal } = useEstado();
  const { t } = useIdioma();
  const modelos = useMemo(() => lucroPorModelo(estado), [estado]);

  return (
    <div className="pagina">
      <div className="g-main">
        <div className="g-2">
          <section className="painel">
            <div className="painel-cab">
              <span className="painel-titulo">{t("home.lucroPorMes")}</span>
            </div>
            <GraficoMensal dados={mensal} />
          </section>

          <section className="painel">
            <div className="painel-cab">
              <span className="painel-titulo">{t("lucro.porSocio")}</span>
              <span className="painel-sub">{t("lucro.acertoNaAba")} <Link href="/socios">{t("nav.socios")}</Link>{t("lucro.acertoNaAbaSuf")}</span>
            </div>
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
        </div>

        <div className="g-meio">
          <section className="painel">
            <div className="painel-cab">
              <span className="painel-titulo">{t("lucro.porModelo")}</span>
              <span className="painel-sub">{t("lucro.porModeloSub")}</span>
            </div>
            <Categorias categorias={modelos} limite={5} />
          </section>

          <section className="painel">
            <div className="painel-cab">
              <span className="painel-titulo">{t("lucro.porCategoria")}</span>
            </div>
            <Categorias categorias={categorias} />
          </section>
        </div>

        <section className="painel">
          <div className="painel-cab">
            <span className="painel-titulo">{t("lucro.ultimasVendas")}</span>
          </div>
          <UltimasVendas pedidos={estado.pedidos} socios={estado.socios} />
        </section>
      </div>
    </div>
  );
}
