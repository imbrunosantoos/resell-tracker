"use client";

import Link from "next/link";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { toNumber } from "@/lib/calculos";
import ResumoCartoes from "@/app/components/ResumoCartoes";
import RelatorioMensal from "@/app/components/RelatorioMensal";
import GraficoMensal from "@/app/components/GraficoMensal";
import ListaParado from "@/app/components/ListaParado";

// Página inicial — visão geral: cartões, este mês, gráfico de lucro, "não vende".
export default function PaginaInicio() {
  const { estado, resumo, relatorio, mensal } = useEstado();
  const { t } = useIdioma();
  const diasAlerta = toNumber(estado.config.diasAlerta) || 30;

  // Só conta o que já está na mão: pedidos sem data de chegada ainda estão a
  // caminho, por isso não entram no stock atual deste atalho.
  const chegados = estado.pedidos.filter((p) => p.dataChegada);
  const totalItens = chegados.reduce((n, p) => n + p.itens.length, 0);
  const emStock = chegados.reduce(
    (n, p) => n + p.itens.filter((it) => !(Number(it.precoVenda) > 0 && it.dataVenda)).length, 0);

  return (
    <div className="pagina">
      <ResumoCartoes resumo={resumo} />

      <section className="bloco">
        <h2>{t("home.esteMes")}</h2>
        <RelatorioMensal relatorio={relatorio} />
      </section>

      <div className="inicio-grelha">
        <section className="bloco">
          <h2>{t("home.lucroPorMes")}</h2>
          <GraficoMensal dados={mensal} />
        </section>

        <section className="bloco">
          <h2>{t("home.naoVende")} <span className="conta">{t("home.parados", { n: diasAlerta })}</span></h2>
          <ListaParado pedidos={estado.pedidos} diasAlerta={diasAlerta} />
        </section>
      </div>

      <section className="bloco">
        <h2>{t("home.atalhos")}</h2>
        <div className="atalhos">
          <Link href="/pedidos" className="atalho">
            <span className="atalho-icone">▦</span>
            <span className="atalho-texto">
              <span className="atalho-label">{t("nav.pedidos")}</span>
              <span className="atalho-sub">{t("home.atalhoStock", { emStock, total: totalItens })}</span>
            </span>
            <span className="atalho-seta">›</span>
          </Link>
          <Link href="/lucro" className="atalho">
            <span className="atalho-icone">📈</span>
            <span className="atalho-texto">
              <span className="atalho-label">{t("nav.lucro")}</span>
              <span className="atalho-sub">{t("home.atalhoLucro")}</span>
            </span>
            <span className="atalho-seta">›</span>
          </Link>
          <Link href="/contas" className="atalho">
            <span className="atalho-icone">🔑</span>
            <span className="atalho-texto">
              <span className="atalho-label">{t("nav.contas")}</span>
              <span className="atalho-sub">{t("home.atalhoContas")}</span>
            </span>
            <span className="atalho-seta">›</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
