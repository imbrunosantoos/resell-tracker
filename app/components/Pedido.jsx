"use client";

import { useRef, useState } from "react";
import {
  eur, toNumber, custoReal, margem, margemPct, diasParaVender, diasEmStock,
  estaVendido, precoMinimo, resumoPedido,
} from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";
import ModalVenda from "./ModalVenda";

const COLUNAS = {
  nome: { valor: (p, it) => it.nome.toLowerCase() },
  categoria: { valor: (p, it) => it.categoria.toLowerCase() },
  precoCompra: { valor: (p, it) => toNumber(it.precoCompra) },
  precoVenda: { valor: (p, it) => toNumber(it.precoVenda) },
  custo: { valor: (p, it) => custoReal(p, it) },
  margem: { valor: (p, it) => margem(p, it) ?? -Infinity },
  dias: { valor: (p, it) => diasParaVender(p, it) ?? Infinity },
};

export default function Pedido({
  pedido, indice, config, socios, corresponde = () => true,
  onEditarPedido, onEditarItem, onMarcarVendido,
  onNovoItem, onApagarItem, onApagarPedido,
  onUploadFoto, onRemoverFoto, onBulkCategoria,
}) {
  const [ordenacao, setOrdenacao] = useState(null);
  const [vendaItem, setVendaItem] = useState(null);
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [catBulk, setCatBulk] = useState("");

  const margemMin = toNumber(config.margemMinima);
  const diasAlerta = toNumber(config.diasAlerta) || 30;
  const resumo = resumoPedido(pedido);

  // ordena uma cópia para mostrar e aplica o filtro de pesquisa às linhas
  let itens = [...pedido.itens];
  if (ordenacao) {
    const { valor } = COLUNAS[ordenacao.coluna];
    itens.sort((a, b) => {
      const va = valor(pedido, a), vb = valor(pedido, b);
      return va < vb ? -ordenacao.dir : va > vb ? ordenacao.dir : 0;
    });
  }
  itens = itens.filter((it) => corresponde(it));

  function ordenarPor(coluna) {
    setOrdenacao((o) => (o?.coluna === coluna ? { coluna, dir: -o.dir } : { coluna, dir: -1 }));
  }
  const seta = (c) => (ordenacao?.coluna === c ? <span className="seta">{ordenacao.dir === -1 ? "↓" : "↑"}</span> : null);
  const Th = ({ coluna, children, dir }) => (
    <th className={"ordenavel" + (dir ? " dir" : "")} onClick={() => ordenarPor(coluna)}>{children}{seta(coluna)}</th>
  );

  // ---------- Seleção múltipla (para mudar categoria de vários de uma vez) ----------
  const todosSelecionados = itens.length > 0 && itens.every((it) => selecionados.has(it.id));
  function alternar(id) {
    setSelecionados((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function alternarTodos() {
    setSelecionados(todosSelecionados ? new Set() : new Set(itens.map((it) => it.id)));
  }
  function aplicarCategoria() {
    onBulkCategoria([...selecionados], catBulk);
    setSelecionados(new Set());
    setCatBulk("");
  }

  const atraso = Math.min(indice, 8) * 0.05;

  return (
    <article className="pedido" style={{ animationDelay: `${atraso}s` }}>
      <div className="pedido-topo">
        <div className="pedido-info">
          <div className="pedido-titulo">
            <input value={pedido.nome} onChange={(e) => onEditarPedido("nome", e.target.value)} />
            <button className="btn fantasma" title="Apagar pedido" onClick={onApagarPedido}>✕</button>
          </div>
          <div className="pedido-meta">
            <label className="campo"><span>Sócio</span>
              <select value={pedido.socioId ?? ""} onChange={(e) => onEditarPedido("socioId", e.target.value)}>
                <option value="">Sozinho</option>
                {socios.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select></label>
            <label className="campo"><span>Compra</span>
              <input type="date" value={pedido.dataCompra} onChange={(e) => onEditarPedido("dataCompra", e.target.value)} /></label>
            <label className="campo"><span>Chegada</span>
              <input type="date" value={pedido.dataChegada} onChange={(e) => onEditarPedido("dataChegada", e.target.value)} /></label>
            <label className="campo"><span>Taxa PayPal €</span>
              <input className="num pequeno" type="number" step="0.01" value={pedido.taxaPaypal} onChange={(e) => onEditarPedido("taxaPaypal", e.target.value)} /></label>
            <label className="campo"><span>Saco €</span>
              <input className="num pequeno" type="number" step="0.01" value={pedido.saco} onChange={(e) => onEditarPedido("saco", e.target.value)} /></label>
          </div>
        </div>

        <div className="pills">
          <Pill label="Investido" valor={eur(resumo.investido)} />
          <Pill label="Vendidos" valor={`${resumo.vendidos}/${resumo.total}`} />
          <Pill label="Receita" valor={eur(resumo.receita)} />
          <Pill label="Lucro" valor={eur(resumo.lucro)} azul />
          <Pill label="Margem" valor={resumo.margemPct !== null ? `${resumo.margemPct}%` : "—"} />
          <Pill label="Dias médios" valor={resumo.diasMedios !== null ? `${resumo.diasMedios} dias` : "—"} />
        </div>
      </div>

      {selecionados.size > 0 && (
        <div className="bulk-bar">
          <strong>{selecionados.size}</strong> selecionado(s) — mudar categoria para:
          <input list="categorias" value={catBulk} onChange={(e) => setCatBulk(e.target.value)} placeholder="categoria" />
          <button className="btn mini primario" onClick={aplicarCategoria}>Aplicar</button>
          <button className="btn mini" onClick={() => setSelecionados(new Set())}>Limpar seleção</button>
        </div>
      )}

      <div className="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th className="col-check"><input type="checkbox" checked={todosSelecionados} onChange={alternarTodos} title="Selecionar todos" /></th>
              <Th coluna="nome">Item</Th>
              <Th coluna="categoria">Categoria</Th>
              <Th coluna="precoCompra" dir>Preço compra</Th>
              <Th coluna="precoVenda" dir>Preço venda</Th>
              <th>Data venda</th>
              <Th coluna="custo" dir>Custo real</Th>
              <Th coluna="margem" dir>Margem</Th>
              <Th coluna="dias" dir>Dias</Th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {itens.length === 0 ? (
              <tr><td colSpan={10} className="vazio" style={{ padding: "14px 8px" }}>Sem itens a mostrar.</td></tr>
            ) : (
              itens.map((item) => (
                <LinhaItem
                  key={item.id}
                  pedido={pedido}
                  item={item}
                  margemMin={margemMin}
                  diasAlerta={diasAlerta}
                  selecionado={selecionados.has(item.id)}
                  onSelecionar={() => alternar(item.id)}
                  onEditar={(campo, valor) => onEditarItem(item.id, campo, valor)}
                  onVender={() => setVendaItem(item)}
                  onApagar={() => onApagarItem(item.id)}
                  onUploadFoto={(ficheiro) => onUploadFoto(item.id, ficheiro)}
                  onRemoverFoto={() => onRemoverFoto(item.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <button className="btn add-item" onClick={onNovoItem}>+ Adicionar item</button>

      {vendaItem && (
        <ModalVenda
          item={vendaItem}
          sugestao={precoMinimo(pedido, vendaItem, margemMin)}
          onConfirmar={(preco, data) => { onMarcarVendido(vendaItem.id, preco, data); setVendaItem(null); }}
          onFechar={() => setVendaItem(null)}
        />
      )}
    </article>
  );
}

function LinhaItem({
  pedido, item, margemMin, diasAlerta, selecionado,
  onSelecionar, onEditar, onVender, onApagar, onUploadFoto, onRemoverFoto,
}) {
  const vendido = estaVendido(item);
  const m = margem(pedido, item);
  const dias = diasParaVender(pedido, item);
  const emStock = diasEmStock(pedido, item);
  const parado = !vendido && emStock !== null && emStock > diasAlerta;
  const minimo = precoMinimo(pedido, item, margemMin);

  return (
    <tr className={(parado ? "parado " : "") + (vendido ? "vendido-linha " : "") + (selecionado ? "selecionado" : "")}>
      <td className="col-check"><input type="checkbox" checked={selecionado} onChange={onSelecionar} /></td>
      <td>
        <div className="td-item">
          <FotoItem item={item} onUpload={onUploadFoto} onRemover={onRemoverFoto} />
          <div className="td-item-campos">
            <span className="td-nome">
              <span className="dot" style={{ background: corCategoria(item.categoria) }} />
              <input className="w-nome" placeholder="ex: Brasil #10" value={item.nome} onChange={(e) => onEditar("nome", e.target.value)} />
              {parado && <span className="badge" title={`Parado há ${emStock} dias`}>⏳ {emStock}d</span>}
            </span>
            <input className="w-notas" placeholder="+ nota" value={item.notas} onChange={(e) => onEditar("notas", e.target.value)} />
          </div>
        </div>
      </td>
      <td><input className="w-cat" list="categorias" placeholder="categoria" value={item.categoria} onChange={(e) => onEditar("categoria", e.target.value)} /></td>
      <td className="dir"><input className="num w-num" type="number" step="0.01" placeholder="€" value={item.precoCompra} onChange={(e) => onEditar("precoCompra", e.target.value)} /></td>
      <td className="dir">
        <input className="num w-num" type="number" step="0.01" placeholder="€" value={item.precoVenda} onChange={(e) => onEditar("precoVenda", e.target.value)} />
        {!vendido && minimo !== null && (
          <span className="minimo" title={`Para ${margemMin}% de margem`}><b>mín.</b> {eur(minimo)}</span>
        )}
      </td>
      <td><input className="w-data" type="date" value={item.dataVenda} onChange={(e) => onEditar("dataVenda", e.target.value)} /></td>
      <td className="dir"><span className="calc dim">{eur(custoReal(pedido, item))}</span></td>
      <td className="dir">
        {m !== null
          ? <span className={"calc " + (m >= 0 ? "pos" : "neg")}>{eur(m)} · {margemPct(pedido, item)}%</span>
          : <span className="calc dim">—</span>}
      </td>
      <td className="dir"><span className="calc dim">{dias !== null ? `${dias} dias` : "—"}</span></td>
      <td className="dir" style={{ whiteSpace: "nowrap" }}>
        {!vendido && <button className="btn mini vender" title="Marcar como vendido" onClick={onVender}>€ vendido</button>}
        <button className="btn fantasma" title="Apagar item" onClick={onApagar}>✕</button>
      </td>
    </tr>
  );
}

// Miniatura da foto da peça. Sem foto, mostra um botão para escolher ficheiro.
function FotoItem({ item, onUpload, onRemover }) {
  const input = useRef(null);
  const tem = Boolean(item.foto);

  return (
    <div className="foto-item">
      {tem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/fotos/${item.foto}`} alt={item.nome || "foto"} onClick={() => input.current?.click()} title="Trocar foto" />
      ) : (
        <button type="button" className="foto-add" onClick={() => input.current?.click()} title="Adicionar foto">📷</button>
      )}
      {tem && <button type="button" className="foto-x" title="Remover foto" onClick={onRemover}>✕</button>}
      <input
        ref={input} type="file" accept="image/*" hidden
        onChange={(e) => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ""; }}
      />
    </div>
  );
}

function Pill({ label, valor, azul }) {
  return (
    <div className={"pill" + (azul ? " azul" : "")}>
      <div className="pill-label">{label}</div>
      <div className="pill-valor">{valor}</div>
    </div>
  );
}
