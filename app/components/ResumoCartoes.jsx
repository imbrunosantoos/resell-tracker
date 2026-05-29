import { eur } from "@/lib/calculos";

// Os cartões de resumo no topo. "Lucro real" = lucro das vendas menos as
// despesas fixas; é esse que se divide pelos sócios.
export default function ResumoCartoes({ resumo }) {
  const cartoes = [
    { label: "Investido", valor: eur(resumo.investido) },
    { label: "Em stock", valor: eur(resumo.stock) },
    { label: "Receita", valor: eur(resumo.receita) },
    { label: "Lucro vendas", valor: eur(resumo.lucro), sinal: resumo.lucro },
    { label: "Despesas fixas", valor: eur(resumo.despesasTotal) },
    { label: "Lucro real", valor: eur(resumo.lucroReal), sinal: resumo.lucroReal },
  ];

  return (
    <div className="cartoes">
      {cartoes.map((c) => (
        <div className="cartao" key={c.label}>
          <span className="cartao-label">{c.label}</span>
          <span className={"cartao-valor" + classeSinal(c.sinal)}>{c.valor}</span>
        </div>
      ))}
      <div className="cartao destaque">
        <span className="cartao-label">Lucro por pessoa</span>
        <span className="cartao-valor">{eur(resumo.porPessoa)}</span>
      </div>
    </div>
  );
}

function classeSinal(sinal) {
  if (sinal === undefined) return "";
  return sinal > 0 ? " pos" : sinal < 0 ? " neg" : "";
}
