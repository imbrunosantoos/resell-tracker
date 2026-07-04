"use client";

import { eur, estaVendido } from "@/lib/calculos";
import { useIdioma } from "./Idioma";
import Icone from "./Icones";

// Métricas rápidas do topo do dashboard: Investido, Lucro líquido, Margem média
// e Inventário (em stock vs vendidos). Calcula contagens e margem global a
// partir do estado + resumo já derivado.
export default function KpisDashboard({ estado, resumo }) {
  const { t } = useIdioma();

  let vendidos = 0, emStock = 0, emTransito = 0;
  for (const p of estado.pedidos) {
    for (const it of p.itens) {
      if (estaVendido(it)) vendidos++;
      else if (p.dataChegada) emStock++;
      else emTransito++;
    }
  }
  const margem = resumo.receita > 0 ? Math.round((resumo.lucro / resumo.receita) * 100) : null;

  const kpis = [
    { icone: "carteira", c: "ambar", label: t("kpi.investido"), valor: eur(resumo.investido),
      sub: t("kpi.subInvestido", { stock: eur(resumo.stock) }) },
    { icone: "lucro", c: resumo.lucroReal >= 0 ? "pos" : "neg", label: t("kpi.lucroLiquido"), valor: eur(resumo.lucroReal),
      sub: t("kpi.subLucro", { bruto: eur(resumo.lucro) }) },
    { icone: "percent", c: "teal", label: t("kpi.margem"), valor: margem === null ? "—" : margem + "%",
      sub: t("kpi.subMargem") },
    { icone: "pedidos", c: "azul", label: t("kpi.inventario"), valor: `${emStock} / ${vendidos}`,
      sub: t("kpi.subInventario", { transito: emTransito }) },
  ];

  return (
    <div className="kpis">
      {kpis.map((k) => (
        <div className={"kpi kpi-" + k.c} key={k.label}>
          <span className="kpi-icone" aria-hidden="true"><Icone id={k.icone} size={21} /></span>
          <span className="kpi-corpo">
            <span className="kpi-label">{k.label}</span>
            <span className={"kpi-valor " + k.c}>{k.valor}</span>
            <span className="kpi-sub">{k.sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
