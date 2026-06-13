"use client";

import Link from "next/link";
import { corCategoria } from "@/lib/cores";
import { useIdioma } from "./Idioma";

// Lista dos itens que tens em stock agora (não vendidos, de pedidos já chegados).
// Cada linha mostra nome + pedido e há quantos dias está parado; clica → abre o
// pedido. Estilo igual ao das "Últimas vendas".
export default function ListaStock({ itens, diasAlerta }) {
  const { t } = useIdioma();

  if (itens.length === 0) return <div className="vazio">{t("stock.vazio")}</div>;

  return (
    <div className="vendas-lista">
      {itens.map(({ pedido, item, dias }) => {
        const parado = dias !== null && dias > diasAlerta;
        return (
          <Link key={item.id} href={`/pedidos/${pedido.id}`} className="stock-linha">
            <span className="venda-info">
              <span className="venda-dot" style={{ background: corCategoria(item.categoria) }} />
              <span className="venda-textos">
                <span className="venda-nome">{item.nome || t("comum.semNome")}</span>
                <span className="venda-sub">{pedido.nome}</span>
              </span>
            </span>
            <span className={"stock-dias" + (parado ? " alerta" : "")}>
              {dias !== null ? t("stock.diasEmStock", { n: dias }) : "—"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
