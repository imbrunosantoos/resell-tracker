"use client";

import { useState } from "react";
import { eur } from "@/lib/calculos";
import { useIdioma } from "./Idioma";

// Gráfico compacto mês a mês, com toggle entre duas vistas:
//   "lucro" — uma barra por mês com o teu lucro (verde ≥0 / vermelho <0)
//   "fluxo" — duas barras por mês: recebido (verde) vs investido (vermelho)
// Barras em CSS (alturas em %), sem libs. Estilos em globals.css.
const fazRotulo = (locale) => (mes) => {
  const [a, m] = mes.split("-");
  const curto = new Date(Number(a), Number(m) - 1, 1).toLocaleDateString(locale, { month: "short" }).replace(".", "");
  return `${curto}/${a.slice(2)}`;
};

export default function GraficoMensal({ dados }) {
  const { t, locale } = useIdioma();
  const [vista, setVista] = useState("lucro");
  const rotulo = fazRotulo(locale);

  const semDados = dados.length === 0 || dados.every((d) => !d.recebido && !d.investido && !d.meuLucro);
  if (semDados) {
    return (
      <div className="grafico">
        <Toggle vista={vista} setVista={setVista} t={t} />
        <p className="grafico-vazio">{t("grafico.vazio")}</p>
      </div>
    );
  }

  return (
    <div className="grafico">
      <Toggle vista={vista} setVista={setVista} t={t} />
      {vista === "lucro" ? <VistaLucro dados={dados} rotulo={rotulo} /> : <VistaFluxo dados={dados} rotulo={rotulo} t={t} />}
    </div>
  );
}

function Toggle({ vista, setVista, t }) {
  return (
    <div className="grafico-toggle">
      <button className={vista === "lucro" ? "ativo" : ""} onClick={() => setVista("lucro")}>
        {t("home.lucroPorMes")}
      </button>
      <button className={vista === "fluxo" ? "ativo" : ""} onClick={() => setVista("fluxo")}>
        {t("grafico.fluxo")}
      </button>
    </div>
  );
}

// ---------- Vista 1: o teu lucro por mês ----------
function VistaLucro({ dados, rotulo }) {
  const maxAbs = Math.max(...dados.map((d) => Math.abs(d.meuLucro)), 1);
  const temNegativos = dados.some((d) => d.meuLucro < 0);

  return (
    <>
      <div className={"barras lucro" + (temNegativos ? " com-zero" : "")}>
        {dados.map((d) => {
          const altura = Math.round((Math.abs(d.meuLucro) / maxAbs) * 100);
          const negativo = d.meuLucro < 0;
          return (
            <div className="col" key={d.mes} title={`${rotulo(d.mes)}: ${eur(d.meuLucro)}`}>
              <span className="col-valor">{eur(d.meuLucro)}</span>
              {temNegativos ? (
                <div className="par-zero">
                  <div className="metade cima">
                    {!negativo && <span className="barra pos" style={{ height: `${altura}%` }} />}
                  </div>
                  <div className="metade baixo">
                    {negativo && <span className="barra neg" style={{ height: `${altura}%` }} />}
                  </div>
                </div>
              ) : (
                <div className="pista">
                  <span className="barra pos" style={{ height: `${altura}%` }} />
                </div>
              )}
              <span className="col-mes">{rotulo(d.mes)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---------- Vista 2: recebido vs investido por mês ----------
function VistaFluxo({ dados, rotulo, t }) {
  const max = Math.max(...dados.map((d) => Math.max(d.recebido, d.investido)), 1);

  return (
    <>
      <div className="legenda">
        <span><i className="ponto-leg pos" /> {t("grafico.recebido")}</span>
        <span><i className="ponto-leg neg" /> {t("grafico.investido")}</span>
      </div>
      <div className="barras fluxo">
        {dados.map((d) => (
          <div className="col" key={d.mes} title={`${rotulo(d.mes)} · ${t("grafico.recebido").toLowerCase()} ${eur(d.recebido)} · ${t("grafico.investido").toLowerCase()} ${eur(d.investido)}`}>
            <div className="pista par">
              <span className="fluxo-bar">
                <span className="col-valor pos">{eur(d.recebido)}</span>
                <span className="barra pos" style={{ height: `${Math.round((d.recebido / max) * 100)}%` }} />
              </span>
              <span className="fluxo-bar">
                <span className="col-valor neg">{eur(d.investido)}</span>
                <span className="barra neg" style={{ height: `${Math.round((d.investido / max) * 100)}%` }} />
              </span>
            </div>
            <span className="col-mes">{rotulo(d.mes)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
