"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine, Legend } from "recharts";
import { eur } from "@/lib/calculos";
import { useIdioma } from "./Idioma";
import Skeleton from "./Skeleton";

// Gráfico mensal (Recharts) com duas vistas:
//   "lucro" — uma barra por mês com o teu lucro (verde ≥0 / vermelho <0)
//   "fluxo" — recebido (verde) vs investido (âmbar) por mês
const POS = "#34D399", NEG = "#FB7185", INV = "#FBBF24";

const fazRotulo = (locale) => (mes) => {
  const [a, m] = String(mes).split("-");
  const curto = new Date(Number(a), Number(m) - 1, 1).toLocaleDateString(locale, { month: "short" }).replace(".", "");
  return `${curto}/${String(a).slice(2)}`;
};

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rc-tip">
      <span className="rc-tip-mes">{label}</span>
      {payload.map((p) => (
        <span key={p.dataKey} className="rc-tip-row" style={{ color: p.color }}>
          {p.name}: <b>{eur(p.value)}</b>
        </span>
      ))}
    </div>
  );
}

export default function GraficoMensal({ dados }) {
  const { t, locale } = useIdioma();
  const [vista, setVista] = useState("lucro");
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const rotulo = fazRotulo(locale);

  const semDados = !dados?.length || dados.every((d) => !d.recebido && !d.investido && !d.meuLucro);
  const data = (dados ?? []).map((d) => ({
    mes: rotulo(d.mes),
    lucro: Math.round(d.meuLucro * 100) / 100,
    recebido: Math.round(d.recebido * 100) / 100,
    investido: Math.round(d.investido * 100) / 100,
  }));

  const eixos = (
    <>
      <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
      <XAxis dataKey="mes" tick={{ fill: "#939BAA", fontSize: 11 }} axisLine={false} tickLine={false} dy={4} interval="preserveStartEnd" />
      <YAxis tick={{ fill: "#5C6675", fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => "€" + v} />
    </>
  );

  return (
    <div className="grafico">
      <div className="grafico-toggle">
        <button className={vista === "lucro" ? "ativo" : ""} onClick={() => setVista("lucro")}>{t("home.lucroPorMes")}</button>
        <button className={vista === "fluxo" ? "ativo" : ""} onClick={() => setVista("fluxo")}>{t("grafico.fluxo")}</button>
      </div>

      {semDados ? (
        <p className="grafico-vazio">{t("grafico.vazio")}</p>
      ) : !montado ? (
        <Skeleton rows={1} height={250} />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          {vista === "lucro" ? (
            <BarChart data={data} margin={{ top: 12, right: 4, left: 0, bottom: 0 }} barCategoryGap="26%">
              {eixos}
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.16)" />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<Tip />} />
              <Bar dataKey="lucro" name={t("vendas.lucro")} radius={[6, 6, 0, 0]} maxBarSize={46}>
                {data.map((d, i) => <Cell key={i} fill={d.lucro >= 0 ? POS : NEG} />)}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 12, right: 4, left: 0, bottom: 0 }} barGap={3} barCategoryGap="22%">
              {eixos}
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Bar dataKey="recebido" name={t("grafico.recebido")} fill={POS} radius={[5, 5, 0, 0]} maxBarSize={30} />
              <Bar dataKey="investido" name={t("grafico.investido")} fill={INV} radius={[5, 5, 0, 0]} maxBarSize={30} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
