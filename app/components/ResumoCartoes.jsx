import { eur } from "@/lib/calculos";
import { useIdioma } from "./Idioma";

// Os cartões de resumo no topo. "Lucro real" = lucro das vendas menos as
// despesas; o destaque "O teu lucro" é a tua parte (já líquida das despesas).
export default function ResumoCartoes({ resumo }) {
  const { t } = useIdioma();
  const cartoes = [
    { label: t("resumo.investido"), valor: eur(resumo.investido), cor: "ambar" },
    { label: t("resumo.emStock"), valor: eur(resumo.stock), cor: "azul" },
    { label: t("resumo.receita"), valor: eur(resumo.receita), cor: "teal" },
    { label: t("resumo.lucroVendas"), valor: eur(resumo.lucro), sinal: resumo.lucro },
    { label: t("resumo.despesas"), valor: eur(resumo.despesasTotal), cor: "coral" },
    { label: t("resumo.lucroReal"), valor: eur(resumo.lucroReal), sinal: resumo.lucroReal },
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
        <span className="cartao-label">{t("resumo.teuLucro")}</span>
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
