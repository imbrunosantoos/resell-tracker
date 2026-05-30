"use client";

import { useState } from "react";
import { eur } from "@/lib/calculos";

// Gráfico compacto mês a mês, com toggle entre duas vistas:
//   "lucro" — uma barra por mês com o teu lucro (verde ≥0 / vermelho <0)
//   "fluxo" — duas barras por mês: recebido (verde) vs investido (vermelho)
// Barras em CSS (alturas em %), sem libs. Estilos em globals.css.
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const rotulo = (mes) => {
  const [a, m] = mes.split("-");
  return `${MESES[Number(m) - 1]}/${a.slice(2)}`;
};

export default function GraficoMensal({ dados }) {
  const [vista, setVista] = useState("lucro");

  const semDados = dados.length === 0 || dados.every((d) => !d.recebido && !d.investido && !d.meuLucro);
  if (semDados) {
    return (
      <div className="grafico">
        <Toggle vista={vista} setVista={setVista} />
        <p className="grafico-vazio">Ainda sem dados que cheguem. Assim que registares compras e vendas, aparece aqui.</p>
      </div>
    );
  }

  return (
    <div className="grafico">
      <Toggle vista={vista} setVista={setVista} />
      {vista === "lucro" ? <VistaLucro dados={dados} /> : <VistaFluxo dados={dados} />}
    </div>
  );
}

function Toggle({ vista, setVista }) {
  return (
    <div className="grafico-toggle">
      <button className={vista === "lucro" ? "ativo" : ""} onClick={() => setVista("lucro")}>
        Lucro por mês
      </button>
      <button className={vista === "fluxo" ? "ativo" : ""} onClick={() => setVista("fluxo")}>
        Recebido vs investido
      </button>
    </div>
  );
}

// ---------- Vista 1: o teu lucro por mês ----------
function VistaLucro({ dados }) {
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
function VistaFluxo({ dados }) {
  const max = Math.max(...dados.map((d) => Math.max(d.recebido, d.investido)), 1);

  return (
    <>
      <div className="legenda">
        <span><i className="ponto-leg pos" /> Recebido</span>
        <span><i className="ponto-leg neg" /> Investido</span>
      </div>
      <div className="barras fluxo">
        {dados.map((d) => (
          <div className="col" key={d.mes} title={`${rotulo(d.mes)} · recebido ${eur(d.recebido)} · investido ${eur(d.investido)}`}>
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
