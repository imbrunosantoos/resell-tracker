"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { corCategoria } from "@/lib/cores";
import { eur, custoReal, margem, estaVendido, estaPendente } from "@/lib/calculos";
import { useIdioma } from "./Idioma";

// Tabela de inventário avançada: uma linha por artigo (achatado de todos os
// pedidos), com filtros rápidos por status. O status deriva-se do item +
// pedido: sem data de chegada → em trânsito; chegou e por vender → à venda;
// vendido → vendido (pendente se o dinheiro ainda não caiu).
function statusDe(pedido, item) {
  if (estaVendido(item)) return "vendido";
  return pedido.dataChegada ? "venda" : "transito";
}

function fmtData(d, locale) {
  if (!d) return "—";
  const t = Date.parse(d);
  if (Number.isNaN(t)) return d;
  return new Date(t).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function TabelaInventario({ estado }) {
  const { t, idioma } = useIdioma();
  const router = useRouter();
  const locale = idioma === "en" ? "en-GB" : idioma === "es" ? "es-ES" : "pt-PT";
  const [status, setStatus] = useState("todos");
  const [texto, setTexto] = useState("");

  // Achata todos os itens em linhas com os campos já calculados, mais recentes
  // primeiro (por data de compra do pedido).
  const linhas = useMemo(() => {
    const out = [];
    for (const p of estado.pedidos) {
      for (const it of p.itens) {
        out.push({
          pedido: p, item: it,
          status: statusDe(p, it),
          pendente: estaPendente(it),
          custo: custoReal(p, it),
          lucro: margem(p, it),
        });
      }
    }
    return out.sort((a, b) => String(b.pedido.dataCompra || "").localeCompare(String(a.pedido.dataCompra || "")));
  }, [estado.pedidos]);

  const contagem = useMemo(() => {
    const c = { todos: linhas.length, transito: 0, venda: 0, vendido: 0 };
    for (const l of linhas) c[l.status]++;
    return c;
  }, [linhas]);

  const visiveis = linhas.filter((l) => {
    if (status !== "todos" && l.status !== status) return false;
    if (texto) {
      const alvo = `${l.item.nome} ${l.item.categoria} ${l.item.tamanho} ${l.pedido.nome}`.toLowerCase();
      if (!alvo.includes(texto.toLowerCase())) return false;
    }
    return true;
  });

  const tabs = [
    { id: "todos", label: t("inv.todos") },
    { id: "transito", label: t("inv.transito") },
    { id: "venda", label: t("inv.venda") },
    { id: "vendido", label: t("inv.vendido") },
  ];

  return (
    <div className="inv">
      <div className="inv-controlos">
        <div className="seg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={"seg-btn" + (status === tab.id ? " ativo" : "")}
              onClick={() => setStatus(tab.id)}
            >
              {tab.label} <span className="seg-conta">{contagem[tab.id]}</span>
            </button>
          ))}
        </div>
        <input
          className="filtro-pesquisa inv-pesquisa"
          type="search"
          placeholder={t("filtros.pesquisar")}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </div>

      {visiveis.length === 0 ? (
        <div className="vazio">{t("inv.vazio")}</div>
      ) : (
        <div className="tabela-scroll">
          <table className="inv-tabela">
            <thead>
              <tr>
                <th>{t("inv.artigo")}</th>
                <th>{t("inv.tamanho")}</th>
                <th>{t("inv.fonte")}</th>
                <th>{t("inv.dataCompra")}</th>
                <th className="dir">{t("inv.custo")}</th>
                <th className="dir">{t("inv.vendaPreco")}</th>
                <th className="dir">{t("inv.lucro")}</th>
                <th>{t("inv.status")}</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map(({ pedido, item, status: st, pendente, custo, lucro }) => (
                <tr key={item.id} className="inv-linha" onClick={() => router.push(`/pedidos/${pedido.id}`)}>
                  <td>
                    <span className="td-nome">
                      <span className="dot" style={{ background: corCategoria(item.categoria) }} />
                      <span className="inv-nome">{item.nome || t("comum.semNome")}</span>
                    </span>
                  </td>
                  <td>{item.tamanho ? <span className="inv-tam">{item.tamanho}</span> : <span className="dim">—</span>}</td>
                  <td className="inv-fonte">{pedido.nome}</td>
                  <td className="calc dim">{fmtData(pedido.dataCompra, locale)}</td>
                  <td className="dir calc">{eur(custo)}</td>
                  <td className="dir calc">{lucro !== null ? eur(Number(item.precoVenda)) : <span className="dim">—</span>}</td>
                  <td className={"dir calc " + (lucro === null ? "dim" : lucro >= 0 ? "pos" : "neg")}>
                    {lucro !== null ? eur(lucro) : "—"}
                  </td>
                  <td>
                    <span className={"status-badge st-" + st}>
                      {st === "vendido" && pendente ? t("inv.pendente") : t("inv." + st)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
