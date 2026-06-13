"use client";

import { useMemo, useState } from "react";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { estaVendido } from "@/lib/calculos";

// Catálogo de produtos: define um modelo base (nome + categoria + versões) e o
// sistema gera as variantes por tamanho × versão, cada uma com SKU. A contagem
// de stock/vendidos por variante vem dos itens ligados (item.varianteId).
const VERSOES_SUGERIDAS = ["Adepto", "Jogador"];

export default function PaginaProdutos() {
  const { estado, novoProduto, apagarProduto } = useEstado();
  const { t } = useIdioma();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Camisa de futebol");
  const [versoes, setVersoes] = useState([...VERSOES_SUGERIDAS]);

  const produtos = estado.produtos ?? [];

  // stock vs vendidos por variante, a partir dos itens ligados
  const contagem = useMemo(() => {
    const m = new Map();
    for (const p of estado.pedidos) {
      for (const it of p.itens) {
        if (!it.varianteId) continue;
        const c = m.get(it.varianteId) ?? { stock: 0, sold: 0 };
        if (estaVendido(it)) c.sold++; else c.stock++;
        m.set(it.varianteId, c);
      }
    }
    return m;
  }, [estado.pedidos]);

  const toggleVersao = (v) =>
    setVersoes((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));

  function criar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    novoProduto({ nome: nome.trim(), categoria, versoes });
    setNome("");
  }

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>{t("prod.novo")}</h2>
        <form className="form-novo" onSubmit={criar}>
          <label className="campo" style={{ flex: "2 1 240px" }}>
            <span>{t("comum.nome")}</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t("prod.phNome")} />
          </label>
          <label className="campo">
            <span>{t("prod.categoria")}</span>
            <input list="categorias" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          </label>
          <div className="campo">
            <span>{t("prod.versoes")}</span>
            <div className="prod-versoes">
              {VERSOES_SUGERIDAS.map((v) => (
                <button
                  type="button" key={v}
                  className={"prod-ver-btn" + (versoes.includes(v) ? " ativo" : "")}
                  aria-pressed={versoes.includes(v)}
                  onClick={() => toggleVersao(v)}
                >{v}</button>
              ))}
            </div>
          </div>
          <button className="btn primario" type="submit">{t("prod.criar")}</button>
        </form>
        <p className="dim pequeno" style={{ marginTop: 10 }}>{t("prod.hint")}</p>
      </section>

      <section className="bloco">
        <h2>{t("prod.catalogo")} <span className="conta">— {t("prod.contagem", { n: produtos.length })}</span></h2>
        {produtos.length === 0 ? (
          <div className="vazio">{t("prod.vazio")}</div>
        ) : (
          <div className="prod-lista">
            {produtos.map((p) => (
              <ProdutoCartao key={p.id} produto={p} contagem={contagem} onApagar={() => apagarProduto(p.id)} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProdutoCartao({ produto, contagem, onApagar, t }) {
  const totalStock = produto.variantes.reduce((n, v) => n + (contagem.get(v.id)?.stock ?? 0), 0);
  const totalSold = produto.variantes.reduce((n, v) => n + (contagem.get(v.id)?.sold ?? 0), 0);

  return (
    <div className="prod-cartao">
      <div className="prod-cab">
        <div className="prod-titulo">
          <span className="prod-nome">{produto.nome}</span>
          {produto.categoria && <span className="chip">{produto.categoria}</span>}
          <span className="dim pequeno">{t("prod.totalLinha", { stock: totalStock, sold: totalSold })}</span>
        </div>
        <button className="btn fantasma" onClick={onApagar} title={t("prod.apagar")}>✕</button>
      </div>

      <div className="prod-vars">
        {produto.variantes.map((v) => {
          const c = contagem.get(v.id) ?? { stock: 0, sold: 0 };
          return (
            <div className="prod-var" key={v.id}>
              <span className="prod-sku" title="SKU">{v.sku}</span>
              <span className="prod-var-meta">
                {v.tamanho && <span className="inv-tam">{v.tamanho}</span>}
                {v.versao && <span className="prod-ver">{v.versao}</span>}
              </span>
              <span className="prod-var-cont">
                <b className="azul">{c.stock}</b> <span className="dim">{t("prod.emStock")}</span>
                <span className="dim"> · </span>
                <b className="pos">{c.sold}</b> <span className="dim">{t("prod.vendidos")}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
