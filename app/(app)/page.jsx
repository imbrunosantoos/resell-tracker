"use client";

import Link from "next/link";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { eur, toNumber } from "@/lib/calculos";
import KpisDashboard from "@/app/components/KpisDashboard";
import GraficoLucro from "@/app/components/GraficoLucro";
import ListaParado from "@/app/components/ListaParado";

// Página inicial — dashboard: KPIs em cima; grelha 2:1 com o gráfico de lucro
// (comparativo do mês no cabeçalho) e, ao lado, o resumo financeiro em linhas
// compactas + a lista "não vende".
export default function PaginaInicio() {
  const { estado, resumo, relatorio, mensal } = useEstado();
  const { t } = useIdioma();
  const diasAlerta = toNumber(estado.config.diasAlerta) || 30;

  const { atual, anterior, variacao } = relatorio;
  const subiu = variacao >= 0;

  // resumo financeiro em linhas rótulo→valor (cores funcionais nos pontos)
  const sinal = (v) => (v > 0 ? "pos" : v < 0 ? "neg" : "");
  const linhas = [
    { c: "#FBBF24", rotulo: t("resumo.investido"), valor: eur(resumo.investido) },
    { c: "#60A5FA", rotulo: t("resumo.emStock"), valor: eur(resumo.stock) },
    { c: "#2DD4BF", rotulo: t("resumo.receita"), valor: eur(resumo.receita) },
    { c: resumo.lucro >= 0 ? "#34D399" : "#FB7185", rotulo: t("resumo.lucroVendas"), valor: eur(resumo.lucro), classe: sinal(resumo.lucro) },
    { c: "#FB7185", rotulo: t("resumo.despesas"), valor: eur(resumo.despesasTotal), classe: resumo.despesasTotal > 0 ? "neg" : "" },
    { c: resumo.lucroReal >= 0 ? "#34D399" : "#FB7185", rotulo: t("resumo.lucroReal"), valor: eur(resumo.lucroReal), classe: sinal(resumo.lucroReal) },
  ];

  return (
    <div className="pagina">
      <KpisDashboard estado={estado} resumo={resumo} />

      <div className="g-main">
        <div className="g-2">
          <section className="painel">
            <div className="painel-cab">
              <span className="painel-titulo">{t("home.lucroPorMes")}</span>
              <div className="painel-acoes mes-comp">
                <Link href={`/vendas/${atual.label}`} className="mes-comp-item" title={t("rel.verVendasMes")}>
                  <small>{t("home.esteMes")}</small>
                  <b className={sinal(atual.lucro)}>{eur(atual.lucro)}</b>
                </Link>
                <Link href={`/vendas/${anterior.label}`} className="mes-comp-item" title={t("rel.verVendasAnterior")}>
                  <small>{t("rel.mesAnterior")}</small>
                  <b>{eur(anterior.lucro)}</b>
                </Link>
                <span className={"chip-var " + (subiu ? "pos" : "neg")}>
                  {subiu ? "▲" : "▼"} {eur(Math.abs(variacao))}
                </span>
              </div>
            </div>
            <GraficoLucro dados={mensal} />
          </section>

          <div className="g-col">
            <section className="painel">
              <div className="painel-cab">
                <span className="painel-titulo">{t("home.resumoFinanceiro")}</span>
              </div>
              <div className="linhas-kv">
                {linhas.map((l) => (
                  <div className="kv" key={l.rotulo}>
                    <span className="kv-rotulo" style={{ "--kv-c": l.c }}>{l.rotulo}</span>
                    <span className={"kv-valor " + (l.classe || "")}>{l.valor}</span>
                  </div>
                ))}
                <div className="kv destaque">
                  <span className="kv-rotulo" style={{ "--kv-c": "var(--cor-pagina)" }}>{t("resumo.teuLucro")}</span>
                  <span className="kv-valor">{eur(resumo.meuLucro)}</span>
                </div>
              </div>
            </section>

            <section className="painel">
              <div className="painel-cab">
                <span className="painel-titulo">{t("home.naoVende")}</span>
                <span className="painel-sub">{t("home.parados", { n: diasAlerta })}</span>
              </div>
              <ListaParado pedidos={estado.pedidos} diasAlerta={diasAlerta} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
