"use client";

import { useState } from "react";
import {
  eur, toNumber, custoReal, margem, margemPct, diasParaVender, diasEmStock,
  estaVendido, precoMinimo, resumoPedido,
} from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";
import ModalVenda from "./ModalVenda";

// Colunas pelas quais a tabela pode ser ordenada. `valor` extrai o número/texto
// a comparar de cada item (já com os cálculos do pedido).
const COLUNAS = {
  nome: { valor: (p, it) => it.nome.toLowerCase(), texto: true },
  categoria: { valor: (p, it) => it.categoria.toLowerCase(), texto: true },
  precoCompra: { valor: (p, it) => toNumber(it.precoCompra) },
  precoVenda: { valor: (p, it) => toNumber(it.precoVenda) },
  custo: { valor: (p, it) => custoReal(p, it) },
  margem: { valor: (p, it) => margem(p, it) ?? -Infinity },
  dias: { valor: (p, it) => diasParaVender(p, it) ?? Infinity },
};

export default function Pedido({
  pedido, indice, config,
  onEditarPedido, onEditarItem, onMarcarVendido,
  onNovoItem, onApagarItem, onApagarPedido,
}) {
  const [ordenacao, setOrdenacao] = useState(null); // { coluna, dir: 1 | -1 }
  const [vendaItem, setVendaItem] = useState(null); // item a marcar como vendido

  const margemMin = toNumber(config.margemMinima);
  const diasAlerta = toNumber(config.diasAlerta) || 30;
  const resumo = resumoPedido(pedido);

  // ordena uma cópia para mostrar, sem mexer na ordem real guardada
  const itens = [...pedido.itens];
  if (ordenacao) {
    const { valor } = COLUNAS[ordenacao.coluna];
    itens.sort((a, b) => {
      const va = valor(pedido, a), vb = valor(pedido, b);
      if (va < vb) return -1 * ordenacao.dir;
      if (va > vb) return 1 * ordenacao.dir;
      return 0;
    });
  }

  function ordenarPor(coluna) {
    setOrdenacao((o) =>
      o?.coluna === coluna ? { coluna, dir: o.dir * -1 } : { coluna, dir: -1 }
    );
  }

  const seta = (coluna) =>
    ordenacao?.coluna === coluna ? <span className="seta">{ordenacao.dir === -1 ? "↓" : "↑"}</span> : null;

  const Th = ({ coluna, children, dir }) => (
    <th className={"ordenavel" + (dir ? " dir" : "")} onClick={() => ordenarPor(coluna)}>
      {children}{seta(coluna)}
    </th>
  );

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
          <Pill label="Lucro" valor={eur(resumo.lucro)} azul sinal={resumo.lucro} />
          <Pill label="Margem" valor={resumo.margemPct !== null ? `${resumo.margemPct}%` : "—"} />
          <Pill label="Dias médios" valor={resumo.diasMedios !== null ? `${resumo.diasMedios} dias` : "—"} />
        </div>
      </div>

      <div className="tabela-scroll">
        <table>
          <thead>
            <tr>
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
              <tr><td colSpan={9} className="vazio" style={{ padding: "14px 8px" }}>Sem itens neste pedido.</td></tr>
            ) : (
              itens.map((item) => (
                <LinhaItem
                  key={item.id}
                  pedido={pedido}
                  item={item}
                  margemMin={margemMin}
                  diasAlerta={diasAlerta}
                  onEditar={(campo, valor) => onEditarItem(item.id, campo, valor)}
                  onVender={() => setVendaItem(item)}
                  onApagar={() => onApagarItem(item.id)}
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

function LinhaItem({ pedido, item, margemMin, diasAlerta, onEditar, onVender, onApagar }) {
  const vendido = estaVendido(item);
  const m = margem(pedido, item);
  const dias = diasParaVender(pedido, item);
  const emStock = diasEmStock(pedido, item);
  const parado = !vendido && emStock !== null && emStock > diasAlerta;
  const minimo = precoMinimo(pedido, item, margemMin);

  return (
    <tr className={(parado ? "parado " : "") + (vendido ? "vendido-linha" : "")}>
      <td>
        <span className="td-nome">
          <span className="dot" style={{ background: corCategoria(item.categoria) }} />
          <input className="w-nome" placeholder="ex: Brasil #10" value={item.nome} onChange={(e) => onEditar("nome", e.target.value)} />
          {parado && <span className="badge" title={`Parado há ${emStock} dias`}>⏳ {emStock}d</span>}
        </span>
      </td>
      <td>
        <input className="w-cat" list="categorias" placeholder="categoria" value={item.categoria} onChange={(e) => onEditar("categoria", e.target.value)} />
      </td>
      <td className="dir">
        <input className="num w-num" type="number" step="0.01" placeholder="€" value={item.precoCompra} onChange={(e) => onEditar("precoCompra", e.target.value)} />
      </td>
      <td className="dir">
        <input className="num w-num" type="number" step="0.01" placeholder="€" value={item.precoVenda} onChange={(e) => onEditar("precoVenda", e.target.value)} />
        {!vendido && minimo !== null && (
          <span className="minimo" title={`Para ${margemMin}% de margem`}><b>mín.</b> {eur(minimo)}</span>
        )}
      </td>
      <td>
        <input className="w-data" type="date" value={item.dataVenda} onChange={(e) => onEditar("dataVenda", e.target.value)} />
      </td>
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

function Pill({ label, valor, azul, sinal }) {
  const cor = sinal === undefined ? "" : sinal > 0 ? " pos" : sinal < 0 ? " neg" : "";
  return (
    <div className={"pill" + (azul ? " azul" : "")}>
      <div className="pill-label">{label}</div>
      <div className={"pill-valor" + (azul ? "" : cor)}>{valor}</div>
    </div>
  );
}
