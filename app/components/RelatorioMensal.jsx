import Link from "next/link";
import { eur } from "@/lib/calculos";
import { useIdioma } from "./Idioma";

// Comparação rápida: o TEU lucro e nº de vendas deste mês vs. o mês passado.
// Os cartões de mês são clicáveis → vista com as vendas desse mês.
export default function RelatorioMensal({ relatorio }) {
  const { t } = useIdioma();
  const { atual, anterior, variacao } = relatorio;
  const subiu = variacao >= 0;

  return (
    <div className="relatorio">
      <Link href={`/vendas/${atual.label}`} className="rel-cartao rel-link" title={t("rel.verVendasMes")}>
        <span className="cartao-label">{t("rel.teuLucroMes")} <span className="dim">({atual.label})</span></span>
        <span className={"cartao-valor " + (atual.lucro >= 0 ? "pos" : "neg")}>{eur(atual.lucro)}</span>
        <span className="rel-extra">{t("rel.vendas", { n: atual.vendas })} ›</span>
      </Link>
      <Link href={`/vendas/${anterior.label}`} className="rel-cartao rel-link" title={t("rel.verVendasAnterior")}>
        <span className="cartao-label">{t("rel.mesAnterior")} <span className="dim">({anterior.label})</span></span>
        <span className="cartao-valor">{eur(anterior.lucro)}</span>
        <span className="rel-extra">{t("rel.vendas", { n: anterior.vendas })} ›</span>
      </Link>
      <div className="rel-cartao">
        <span className="cartao-label">{t("rel.variacao")}</span>
        <span className={"cartao-valor " + (subiu ? "pos" : "neg")}>
          {subiu ? "▲" : "▼"} {eur(Math.abs(variacao))}
        </span>
        <span className="rel-extra">{t("rel.faceMesPassado")}</span>
      </div>
    </div>
  );
}
