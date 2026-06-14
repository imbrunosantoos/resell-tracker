"use client";

import { useState } from "react";
import { eur } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";
import { useIdioma } from "./Idioma";

// Lucro por categoria/modelo + duas métricas que dizem quais rodam mais rápido:
// sell-through (% já vendido) e dias médios até vender. Com `limite`, mostra só
// os primeiros N e um "ver mais" para não despejar tudo de uma vez.
export default function Categorias({ categorias, limite }) {
  const { t } = useIdioma();
  const [expandido, setExpandido] = useState(false);
  const comVendas = categorias.filter((c) => c.vendidos > 0);
  if (comVendas.length === 0) {
    return <p className="dim pequeno">{t("cat.vazio")}</p>;
  }

  const maxLucro = Math.max(...comVendas.map((c) => Math.abs(c.lucro)), 1);
  const temLimite = limite && comVendas.length > limite;
  const visiveis = temLimite && !expandido ? comVendas.slice(0, limite) : comVendas;

  return (
    <div className="categorias">
      {visiveis.map((c) => {
        const largura = Math.round((Math.abs(c.lucro) / maxLucro) * 100);
        const cor = corCategoria(c.nome);
        return (
          <div className="cat-linha" key={c.nome}>
            <span className="cat-nome">
              <span className="cat-dot" style={{ background: cor }} />
              {c.nome}
            </span>
            <span className="cat-meio">
              <span className="cat-barra">
                <span style={{ width: `${largura}%`, background: cor }} />
              </span>
              <span className="cat-stats">
                <b>{c.sellThrough}%</b> {t("cat.vendidoSuffix")} ({c.vendidos}/{c.total})
                {c.diasMedios !== null && <> · <b>{c.diasMedios}</b> {t("cat.diasMedios")}</>}
              </span>
            </span>
            <span className={"cat-valor " + (c.lucro >= 0 ? "pos" : "neg")}>{eur(c.lucro)}</span>
          </div>
        );
      })}
      {temLimite && (
        <button className="cat-vermais" type="button" onClick={() => setExpandido((v) => !v)}>
          {expandido ? t("cat.verMenos") : t("cat.verMais", { n: comVendas.length - limite })}
        </button>
      )}
    </div>
  );
}
