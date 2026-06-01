import Link from "next/link";
import { eur } from "@/lib/calculos";

// Comparação rápida: o TEU lucro e nº de vendas deste mês vs. o mês passado.
// Os cartões de mês são clicáveis → vista com as vendas desse mês.
export default function RelatorioMensal({ relatorio }) {
  const { atual, anterior, variacao } = relatorio;
  const subiu = variacao >= 0;

  return (
    <div className="relatorio">
      <Link href={`/vendas/${atual.label}`} className="rel-cartao rel-link" title="Ver as vendas deste mês">
        <span className="cartao-label">O teu lucro este mês <span className="dim">({atual.label})</span></span>
        <span className={"cartao-valor " + (atual.lucro >= 0 ? "pos" : "neg")}>{eur(atual.lucro)}</span>
        <span className="rel-extra">{atual.vendas} venda(s) ›</span>
      </Link>
      <Link href={`/vendas/${anterior.label}`} className="rel-cartao rel-link" title="Ver as vendas do mês anterior">
        <span className="cartao-label">Mês anterior <span className="dim">({anterior.label})</span></span>
        <span className="cartao-valor">{eur(anterior.lucro)}</span>
        <span className="rel-extra">{anterior.vendas} venda(s) ›</span>
      </Link>
      <div className="rel-cartao">
        <span className="cartao-label">Variação</span>
        <span className={"cartao-valor " + (subiu ? "pos" : "neg")}>
          {subiu ? "▲" : "▼"} {eur(Math.abs(variacao))}
        </span>
        <span className="rel-extra">face ao mês passado</span>
      </div>
    </div>
  );
}
