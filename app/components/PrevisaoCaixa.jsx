"use client";

import { eur } from "@/lib/calculos";
import { useIdioma } from "./Idioma";

// Painel de previsão de caixa (aba Vendas): o que está a entrar (vendas
// pendentes, por horizonte estimado) e o capital ainda preso (em trânsito / em
// stock). Os horizontes são estimativa — ver nota no rodapé do painel.
export default function PrevisaoCaixa({ previsao }) {
  const { t } = useIdioma();
  const { aReceber, emTransito, emStock, baldes } = previsao;
  const maxBalde = Math.max(1, ...baldes.map((b) => b.valor));

  const resumo = [
    { c: "pos", label: t("caixa.aReceber"), valor: aReceber },
    { c: "ambar", label: t("caixa.emTransito"), valor: emTransito },
    { c: "azul", label: t("caixa.emStock"), valor: emStock },
  ];
  const rotulo = { ate7: t("caixa.ate7"), ate14: t("caixa.ate14"), depois: t("caixa.depois") };

  return (
    <div className="caixa">
      <div className="caixa-resumo">
        {resumo.map((r) => (
          <div className={"caixa-num caixa-" + r.c} key={r.label}>
            <span className="caixa-label">{r.label}</span>
            <span className={"caixa-valor " + r.c}>{eur(r.valor)}</span>
          </div>
        ))}
      </div>

      <div className="caixa-timeline">
        {baldes.map((b) => (
          <div className="caixa-balde" key={b.chave}>
            <div className="caixa-balde-topo">
              <span className="caixa-balde-rot">{rotulo[b.chave]}</span>
              <span className="caixa-balde-val">
                {eur(b.valor)} <span className="dim">· {t("caixa.vendas", { n: b.n })}</span>
              </span>
            </div>
            <div className="caixa-barra">
              <span style={{ width: (b.valor / maxBalde) * 100 + "%" }} />
            </div>
          </div>
        ))}
      </div>

      <p className="caixa-nota">{t("caixa.nota")}</p>
    </div>
  );
}
