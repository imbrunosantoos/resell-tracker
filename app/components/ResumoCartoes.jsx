import { eur } from "@/lib/calculos";

// Os cartões de resumo no topo. "Lucro real" = lucro das vendas menos as
// despesas; o destaque "O teu lucro" é a tua parte (já líquida das despesas).
export default function ResumoCartoes({ resumo }) {
  const cartoes = [
    { label: "Investido", valor: eur(resumo.investido), cor: "ambar" },
    { label: "Em stock", valor: eur(resumo.stock) },
    { label: "Receita", valor: eur(resumo.receita) },
    { label: "Lucro vendas", valor: eur(resumo.lucro), sinal: resumo.lucro },
    { label: "Despesas", valor: eur(resumo.despesasTotal), cor: "coral" },
    { label: "Lucro real", valor: eur(resumo.lucroReal), sinal: resumo.lucroReal },
  ];

  return (
    <div className="cartoes">
      {cartoes.map((c) => (
        <div className="cartao" key={c.label}>
          <span className="cartao-label">{c.label}</span>
          <span className={"cartao-valor" + classe(c)}>{c.valor}</span>
        </div>
      ))}
      <div className="cartao destaque">
        <span className="cartao-label">O teu lucro</span>
        <span className="cartao-valor">{eur(resumo.meuLucro)}</span>
      </div>
    </div>
  );
}

// Cor explícita (âmbar/coral) tem prioridade; senão verde/vermelho pelo sinal.
function classe(c) {
  if (c.cor) return " " + c.cor;
  if (c.sinal === undefined) return "";
  return c.sinal > 0 ? " pos" : c.sinal < 0 ? " neg" : "";
}
