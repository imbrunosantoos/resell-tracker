"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { eur } from "@/lib/calculos";
import { useIdioma } from "./Idioma";

// Gráfico de lucro mensal (a minha parte, líquida de despesas) — barras verdes
// nos meses positivos, vermelhas nos negativos. Substitui o gráfico de barras
// feito à mão pela página inicial; usa Recharts para tooltip/eixos polidos.
const POS = "#34D399", NEG = "#FB7185";

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
      <ResponsiveContainer width="100%" height={272}>
        <BarChart data={data} margin={{ top: 12, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fill: "#939BAA", fontSize: 11 }} axisLine={false} tickLine={false} dy={4} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "#5C6675", fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => "€" + v} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.14)" />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<Toolttip />} />
          <Bar dataKey="lucro" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive>
            {data.map((d, i) => (
              <Cell key={i} fill={d.lucro >= 0 ? POS : NEG} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
