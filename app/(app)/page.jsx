"use client";

import Link from "next/link";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { eur, toNumber } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";
import KpisDashboard from "@/app/components/KpisDashboard";
import GraficoLucro from "@/app/components/GraficoLucro";
import ListaParado from "@/app/components/ListaParado";

// Página inicial — dashboard: KPIs em cima; gráfico + resumo financeiro na
// fila do meio; últimas vendas + "não vende" lado a lado a fechar.
export default function PaginaInicio() {
  const { estado, resumo, relatorio, vendas, mensal } = useEstado();
  const { t } = useIdioma();
  const diasAlerta = toNumber(estado.config.diasAlerta) || 30;

  const { atual, anterior, variacao } = relatorio;
  const subiu = variacao >= 0;

  // resumo financeiro em linhas rótulo→valor (cores funcionais nos pontos)
  const sinal = (v) => (v > 0 ? "pos" : v < 0 ? "neg" : "");
  // cada linha navega para a aba correspondente
  const linhas = [
    { c: "#FBBF24", rotulo: t("resumo.investido"), valor: eur(resumo.investido), href: "/pedidos" },
    { c: "#60A5FA", rotulo: t("resumo.emStock"), valor: eur(resumo.stock), href: "/pedidos?vista=stock" },
    { c: "#2DD4BF", rotulo: t("resumo.receita"), valor: eur(resumo.receita), href: "/vendas" },
    { c: resumo.lucro >= 0 ? "#34D399" : "#FB7185", rotulo: t("resumo.lucroVendas"), valor: eur(resumo.lucro), classe: sinal(resumo.lucro), href: "/lucro" },
    { c: "#FB7185", rotulo: t("resumo.despesas"), valor: eur(resumo.despesasTotal), classe: resumo.despesasTotal > 0 ? "neg" : "", href: "/despesas" },
    { c: resumo.lucroReal >= 0 ? "#34D399" : "#FB7185", rotulo: t("resumo.lucroReal"), valor: eur(resumo.lucroReal), classe: sinal(resumo.lucroReal), href: "/lucro" },
  ];

  // últimas 5 vendas (pendentes + concluídas), mais recentes primeiro
  const ultimas = [
    ...vendas.pendentes.map((v) => ({ ...v, pendente: true })),
    ...vendas.concluidos.map((v) => ({ ...v, pendente: false })),
  ]
    .sort((a, b) => (a.item.dataVenda < b.item.dataVenda ? 1 : -1))
    .slice(0, 5);

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

          <section className="painel">
            <div className="painel-cab">
              <span className="painel-titulo">{t("home.resumoFinanceiro")}</span>
            </div>
            <div className="linhas-kv">
              {linhas.map((l) => (
                <Link className="kv" href={l.href} key={l.rotulo}>
                  <span className="kv-rotulo" style={{ "--kv-c": l.c }}>{l.rotulo}</span>
                  <span className={"kv-valor " + (l.classe || "")}>{l.valor}</span>
                </Link>
              ))}
              <Link className="kv destaque" href="/lucro">
                <span className="kv-rotulo" style={{ "--kv-c": "var(--cor-pagina)" }}>{t("resumo.teuLucro")}</span>
                <span className="kv-valor">{eur(resumo.meuLucro)}</span>
              </Link>
            </div>
          </section>
        </div>

        <div className="g-meio">
          <section className="painel">
            <div className="painel-cab">
              <span className="painel-titulo">{t("lucro.ultimasVendas")}</span>
              <div className="painel-acoes">
                <Link className="painel-link" href="/lucro">{t("home.verTodas")}</Link>
              </div>
            </div>
            {ultimas.length === 0 ? (
              <p className="dim pequeno">{t("vendas.semVendasAinda")}</p>
            ) : (
              <div className="mini-vendas">
                {ultimas.map(({ pedido, item, minhaParte, pendente }) => (
                  <div className="mini-venda" key={item.id}>
                    <span className="venda-dot" style={{ background: corCategoria(item.categoria) }} />
                    <span className="mini-venda-txt">
                      <Link href={`/pedidos/${pedido.id}`}>{item.nome || t("comum.semNome")}</Link>
                      <small className="dim">{pedido.nome} · {item.dataVenda}</small>
                    </span>
                    {pendente && <span className="badge">{t("inv.pendente")}</span>}
                    <span className="mini-venda-vals">
                      <b>{eur(item.precoVenda)}</b>
                      <small className="dim">{t("vendas.tua")} <span className="pos">{eur(minhaParte)}</span></small>
                    </span>
                  </div>
                ))}
              </div>
            )}
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
  );
}
