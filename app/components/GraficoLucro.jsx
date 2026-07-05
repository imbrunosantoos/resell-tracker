"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, LabelList } from "recharts";
import { eur } from "@/lib/calculos";
import { useIdioma } from "./Idioma";
import Skeleton from "./Skeleton";

// Gráfico de lucro mensal (a minha parte, líquida de despesas) — área com
// gradiente sob a linha; os meses negativos descem abaixo da linha do zero.
const ACCENT = "#34D399";

// Rótulo do valor de cada mês — na fonte mono do site e verde/vermelho pelo sinal.
const corSinal = (v) => (v >= 0 ? "#34D399" : "#FB7185");
const rotuloMono = (cor) => {
  function Rotulo({ x, y, width = 0, value }) {
    if (value == null || value === "") return null;
    const c = typeof cor === "function" ? cor(value) : cor;
    return (
      <text x={x + width / 2} y={y - 9} textAnchor="middle" fill={c} fontSize={11} fontWeight={700} style={{ fontFamily: "var(--mono)" }}>
        {"€" + Math.round(value)}
      </text>
    );
  }
  return Rotulo;
};

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

// Ponto da série: cheio nos meses fechados, OCO (tracejado) no mês em curso.
function pontoMes(props) {
  const { cx, cy, payload, index } = props;
  if (payload?.emCurso) {
    return <circle key={"p" + index} cx={cx} cy={cy} r={4} fill="#0E1116" stroke={ACCENT} strokeWidth={2} strokeDasharray="2.5 2" />;
  }
  return <circle key={"p" + index} cx={cx} cy={cy} r={2.6} fill={ACCENT} />;
}

export default function GraficoLucro({ dados }) {
  const { t, idioma } = useIdioma();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const locale = idioma === "en" ? "en-GB" : idioma === "es" ? "es-ES" : "pt-PT";

  // o mês em curso é marcado (ponto oco + linha tracejada) — não é um mês fechado
  const mesAtual = new Date().toISOString().slice(0, 7);
  const data = (dados ?? []).map((d) => ({
    mes: rotuloMes(d.mes, locale),
    lucro: Math.round(d.meuLucro * 100) / 100,
    emCurso: d.mes === mesAtual,
  }));
  const rotuloEmCurso = data.find((d) => d.emCurso)?.mes;
  if (data.length === 0 || data.every((d) => d.lucro === 0)) {
    return <div className="grafico grafico-vazio">{t("home.semDados")}</div>;
  }

  return (
    <div className="grafico">
      {!montado ? (
        <Skeleton rows={1} height={272} />
      ) : (
        <ResponsiveContainer width="100%" height={272}>
          <AreaChart data={data} margin={{ top: 26, right: 22, left: 0, bottom: 0 }}>
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
            {rotuloEmCurso && (
              <ReferenceLine
                x={rotuloEmCurso} stroke="rgba(255,255,255,0.16)" strokeDasharray="4 4"
                label={{ value: t("grafico.emCurso"), position: "insideBottom", fill: "#5C6675", fontSize: 9.5 }}
              />
            )}
            <Tooltip cursor={{ stroke: "rgba(255,255,255,0.14)", strokeWidth: 1 }} content={<Toolttip />} />
            <Area
              type="monotone" dataKey="lucro" stroke={ACCENT} strokeWidth={2.5}
              fill="url(#lucroGrad)" dot={pontoMes} activeDot={{ r: 4.5 }}
            >
              <LabelList dataKey="lucro" content={rotuloMono(corSinal)} />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
