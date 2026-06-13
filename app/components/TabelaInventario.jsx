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

// Ordenação: valor comparável por coluna. Texto compara-se com localeCompare;
// número e data comparam-se diretamente; o status segue a ordem do ciclo.
const STATUS_ORDEM = { transito: 0, venda: 1, vendido: 2 };
function valorOrdenacao(l, campo) {
  switch (campo) {
    case "artigo": return (l.item.nome || "").toLowerCase();
    case "tamanho": return (l.item.tamanho || "").toLowerCase();
    case "fonte": return (l.pedido.nome || "").toLowerCase();
    case "data": return l.pedido.dataCompra || "";
    case "custo": return l.custo;
    case "venda": return Number(l.item.precoVenda) || 0;
    case "lucro": return l.lucro ?? -Infinity;
    case "status": return STATUS_ORDEM[l.status] ?? 0;
    default: return 0;
  }
}

export default function TabelaInventario({ estado }) {
  const { t, idioma } = useIdioma();
  const router = useRouter();
  const locale = idioma === "en" ? "en-GB" : idioma === "es" ? "es-ES" : "pt-PT";
  const [status, setStatus] = useState("todos");
  const [texto, setTexto] = useState("");
  const [ordenar, setOrdenar] = useState({ campo: "data", dir: "desc" });

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

  const ordenadas = [...visiveis].sort((a, b) => {
    const va = valorOrdenacao(a, ordenar.campo);
    const vb = valorOrdenacao(b, ordenar.campo);
    const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
    return ordenar.dir === "asc" ? cmp : -cmp;
  });

  function clicarOrdenar(campo) {
    setOrdenar((o) => (o.campo === campo ? { campo, dir: o.dir === "asc" ? "desc" : "asc" } : { campo, dir: "asc" }));
  }
  const seta = (campo) => (ordenar.campo === campo ? <span className="seta">{ordenar.dir === "asc" ? "↑" : "↓"}</span> : null);

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

      {ordenadas.length === 0 ? (
        <div className="vazio">{t("inv.vazio")}</div>
      ) : (
        <div className="inv-scroll">
          <table className="inv-tabela">
            <thead>
              <tr>
                <th className="ordenavel" onClick={() => clicarOrdenar("artigo")}>{t("inv.artigo")} {seta("artigo")}</th>
                <th className="ordenavel" onClick={() => clicarOrdenar("tamanho")}>{t("inv.tamanho")} {seta("tamanho")}</th>
                <th className="ordenavel" onClick={() => clicarOrdenar("fonte")}>{t("inv.fonte")} {seta("fonte")}</th>
                <th className="ordenavel" onClick={() => clicarOrdenar("data")}>{t("inv.dataCompra")} {seta("data")}</th>
                <th className="dir ordenavel" onClick={() => clicarOrdenar("custo")}>{t("inv.custo")} {seta("custo")}</th>
                <th className="dir ordenavel" onClick={() => clicarOrdenar("venda")}>{t("inv.vendaPreco")} {seta("venda")}</th>
                <th className="dir ordenavel" onClick={() => clicarOrdenar("lucro")}>{t("inv.lucro")} {seta("lucro")}</th>
                <th className="ordenavel" onClick={() => clicarOrdenar("status")}>{t("inv.status")} {seta("status")}</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map(({ pedido, item, status: st, pendente, custo, lucro }) => (
                <tr key={item.id} className="inv-linha" onClick={() => router.push(`/pedidos/${pedido.id}`)}>
                  <td>
                    <span className="td-nome">
                      <span className="inv-capa" style={item.foto ? undefined : { background: corCategoria(item.categoria) }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {item.foto ? <img src={`/api/fotos/${item.foto}`} alt="" /> : (item.nome || "?").trim().charAt(0).toUpperCase()}
                      </span>
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
