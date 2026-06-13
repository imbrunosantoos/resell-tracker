"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, LabelList } from "recharts";
import { eur } from "@/lib/calculos";
import { useIdioma } from "./Idioma";
import Skeleton from "./Skeleton";

// Gráfico de lucro mensal (a minha parte, líquida de despesas) — área com
// gradiente sob a linha; os meses negativos descem abaixo da linha do zero.
const ACCENT = "#34D399";

// Rótulo do valor de cada mês, por cima do ponto (€ arredondado para caber).
const rotuloValor = (v) => (v || v === 0 ? "€" + Math.round(v) : "");

function rotuloMes(mes, locale) {
  const [a, m] = String(mes).split("-").map(Number);
  if (!a || !m) return mes;
  const nome = new Date(a, m - 1, 1).toLocaleDateString(locale, { month: "short" }).replace(".", "");
  return `${nome}/${String(a).slice(2)}`;
}

function Toolttip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rc-tip">
      <span className="rc-tip-mes">{label}</span>
      <span className={"rc-tip-val " + (v >= 0 ? "pos" : "neg")}>{eur(v)}</span>
    </div>
  );
}

export default function GraficoLucro({ dados }) {
  const { t, idioma } = useIdioma();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const locale = idioma === "en" ? "en-GB" : idioma === "es" ? "es-ES" : "pt-PT";

  const data = (dados ?? []).map((d) => ({
    mes: rotuloMes(d.mes, locale),
    lucro: Math.round(d.meuLucro * 100) / 100,
  }));
  if (data.length === 0 || data.every((d) => d.lucro === 0)) {
    return <div className="grafico grafico-vazio">{t("home.semDados")}</div>;
  }

  return (
    <div className="grafico">
      {!montado ? (
        <Skeleton rows={1} height={272} />
      ) : (
        <ResponsiveContainer width="100%" height={272}>
          <AreaChart data={data} margin={{ top: 26, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lucroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.42} />
                <stop offset="92%" stopColor={ACCENT} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "#939BAA", fontSize: 11 }} axisLine={false} tickLine={false} dy={4} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#5C6675", fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => "€" + v} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.16)" />
            <Tooltip cursor={{ stroke: "rgba(255,255,255,0.14)", strokeWidth: 1 }} content={<Toolttip />} />
            <Area
              type="monotone" dataKey="lucro" stroke={ACCENT} strokeWidth={2.5}
              fill="url(#lucroGrad)" dot={{ r: 2.6, fill: ACCENT, strokeWidth: 0 }} activeDot={{ r: 4.5 }}
            >
              <LabelList dataKey="lucro" position="top" offset={10} formatter={rotuloValor} fill="#ECEEF2" fontSize={11} fontWeight={600} />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
