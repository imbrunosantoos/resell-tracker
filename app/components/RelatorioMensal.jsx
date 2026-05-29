import { eur } from "@/lib/calculos";

// Comparação rápida: lucro e nº de vendas deste mês vs. o mês passado.
export default function RelatorioMensal({ relatorio }) {
  const { atual, anterior, variacao } = relatorio;
  const subiu = variacao >= 0;

  return (
    <div className="relatorio">
      <div className="rel-cartao">
        <span className="cartao-label">Lucro este mês <span className="dim">({atual.label})</span></span>
        <span className={"cartao-valor " + (atual.lucro >= 0 ? "pos" : "neg")}>{eur(atual.lucro)}</span>
        <span className="rel-extra">{atual.vendas} venda(s)</span>
      </div>
      <div className="rel-cartao">
        <span className="cartao-label">Mês anterior <span className="dim">({anterior.label})</span></span>
        <span className="cartao-valor">{eur(anterior.lucro)}</span>
        <span className="rel-extra">{anterior.vendas} venda(s)</span>
      </div>
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
