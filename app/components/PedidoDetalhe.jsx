"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEstado } from "./contexto";
import {
  eur, toNumber, custoReal, margem, margemPct, diasParaVender, diasEmStock,
  estaVendido, precoMinimo, resumoPedido,
} from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";
import { tamanhosPara } from "@/lib/tamanhos";
import ModalVenda from "./ModalVenda";
import Lightbox from "./Lightbox";

// Detalhe de um pedido: cabeçalho editável, resumo e os itens em cartões com
// foto grande. Reusa os handlers do contexto.
export default function PedidoDetalhe({ pedido }) {
  const router = useRouter();
  const {
    estado, editarCampo, marcarVendido, novoItem, apagarItem, apagarPedido,
    uploadFoto, removerFoto, bulkCategoria, aplicarTemplate,
  } = useEstado();
  const socios = estado.socios;
  const config = estado.config;

  // Templates para o autofill: itens já existentes, distintos por nome (preferindo
  // os que têm foto e preço). Ao escolher um, copia-se foto/preço/categoria.
  const templates = useMemo(() => {
    const porNome = new Map();
    for (const p of estado.pedidos) {
      for (const it of p.itens) {
        const nome = it.nome?.trim();
        if (!nome) continue;
        const chave = nome.toLowerCase();
        const atual = porNome.get(chave);
        const pontos = (it.foto ? 2 : 0) + (toNumber(it.precoCompra) > 0 ? 1 : 0);
        if (!atual || pontos > atual.pontos) {
          porNome.set(chave, {
            pontos, origemId: it.id, nome, categoria: it.categoria,
            precoCompra: it.precoCompra, foto: it.foto,
          });
        }
      }
    }
    return [...porNome.values()];
  }, [estado.pedidos]);

  const [vendaItem, setVendaItem] = useState(null);
  const [zoom, setZoom] = useState(null); // src da foto em lightbox
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [catBulk, setCatBulk] = useState("");

  const margemMin = toNumber(config.margemMinima);
  const diasAlerta = toNumber(config.diasAlerta) || 30;
  const r = resumoPedido(pedido);

  const editP = (campo, valor) => editarCampo("pedidos", pedido.id, campo, valor);
  const editI = (itemId, campo, valor) => editarCampo("itens", itemId, campo, valor);

  async function aoApagarPedido() {
    const ok = await apagarPedido(pedido.id);
    if (ok) router.replace("/pedidos");
  }

  function alternar(id) {
    setSelecionados((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function aplicarCategoria() {
    bulkCategoria([...selecionados], catBulk);
    setSelecionados(new Set());
    setCatBulk("");
  }

  // Colar (Cmd/Ctrl+V) uma imagem: se houver 1 item selecionado, vai para esse;
  // senão cria um item novo já com a foto. Um ref guarda os valores frescos para
  // o listener não precisar de ser re-registado a cada render.
  const colarRef = useRef(null);
  colarRef.current = { selecionados, pedidoId: pedido.id, novoItem, uploadFoto };
  useEffect(() => {
    async function aoColar(e) {
      const itens = e.clipboardData?.items;
      if (!itens) return;
      let ficheiro = null;
      for (const it of itens) {
        if (it.kind === "file" && it.type.startsWith("image/")) { ficheiro = it.getAsFile(); break; }
      }
      if (!ficheiro) return; // sem imagem na área de transferência → deixa o paste normal
      e.preventDefault();
      const { selecionados, pedidoId, novoItem, uploadFoto } = colarRef.current;
      if (selecionados.size === 1) {
        await uploadFoto([...selecionados][0], ficheiro);
      } else {
        const novo = await novoItem(pedidoId);
        await uploadFoto(novo.id, ficheiro);
      }
    }
    window.addEventListener("paste", aoColar);
    return () => window.removeEventListener("paste", aoColar);
  }, []);

  return (
    <article className="detalhe">
      <div className="detalhe-topo">
        <div className="detalhe-cab">
          <input className="detalhe-titulo" value={pedido.nome} onChange={(e) => editP("nome", e.target.value)} />
          <button className="btn fantasma" title="Apagar pedido" onClick={aoApagarPedido}>✕ Apagar</button>
        </div>

        <div className="pedido-meta">
          <label className="campo"><span>Sócio</span>
            <select value={pedido.socioId ?? ""} onChange={(e) => editP("socioId", e.target.value)}>
              <option value="">Sozinho</option>
              {socios.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select></label>
          <label className="campo"><span>Compra</span>
            <input type="date" value={pedido.dataCompra} onChange={(e) => editP("dataCompra", e.target.value)} /></label>
          <label className="campo"><span>Chegada</span>
            <input type="date" value={pedido.dataChegada} onChange={(e) => editP("dataChegada", e.target.value)} /></label>
          <label className="campo"><span>Taxa PayPal €</span>
            <input className="num pequeno" type="number" step="0.01" value={pedido.taxaPaypal} onChange={(e) => editP("taxaPaypal", e.target.value)} /></label>
          <label className="campo"><span>Saco €</span>
            <input className="num pequeno" type="number" step="0.01" value={pedido.saco} onChange={(e) => editP("saco", e.target.value)} /></label>
        </div>

        <div className="pills">
          <Pill label="Investido" valor={eur(r.investido)} />
          <Pill label="Vendidos" valor={`${r.vendidos}/${r.total}`} />
          <Pill label="Receita" valor={eur(r.receita)} />
          <Pill label="Lucro" valor={eur(r.lucro)} azul />
          <Pill label="Margem" valor={r.margemPct !== null ? `${r.margemPct}%` : "—"} />
          <Pill label="Dias médios" valor={r.diasMedios !== null ? `${r.diasMedios} dias` : "—"} />
        </div>
      </div>

      {selecionados.size > 0 && (
        <div className="bulk-bar">
          <strong>{selecionados.size}</strong> selecionado(s) — mudar categoria para:
          <input list="categorias" value={catBulk} onChange={(e) => setCatBulk(e.target.value)} placeholder="categoria" />
          <button className="btn mini primario" onClick={aplicarCategoria}>Aplicar</button>
          <button className="btn mini" onClick={() => setSelecionados(new Set())}>Limpar</button>
        </div>
      )}

      <p className="colar-dica">📋 Cola uma imagem (⌘V) para criar um item com a foto — ou seleciona 1 item para colar nesse.</p>

      <div className="itens-grelha">
        {pedido.itens.map((item) => (
          <ItemCartao
            key={item.id}
            pedido={pedido} item={item} margemMin={margemMin} diasAlerta={diasAlerta}
            selecionado={selecionados.has(item.id)}
            onSelecionar={() => alternar(item.id)}
            onEditar={(campo, valor) => editI(item.id, campo, valor)}
            onVender={() => setVendaItem(item)}
            onApagar={() => apagarItem(pedido.id, item.id)}
            onUploadFoto={(f) => uploadFoto(item.id, f)}
            onRemoverFoto={() => removerFoto(item.id)}
            onZoom={(src) => setZoom(src)}
            templates={templates}
            onTemplate={(origemId) => aplicarTemplate(item.id, origemId)}
          />
        ))}
        <button className="item-add" onClick={() => novoItem(pedido.id)}>+ Adicionar item</button>
      </div>

      {vendaItem && (
        <ModalVenda
          item={vendaItem}
          sugestao={precoMinimo(pedido, vendaItem, margemMin)}
          onConfirmar={(preco, data) => { marcarVendido(pedido.id, vendaItem.id, preco, data); setVendaItem(null); }}
          onFechar={() => setVendaItem(null)}
        />
      )}
      {zoom && <Lightbox src={zoom} onFechar={() => setZoom(null)} />}
    </article>
  );
}

function ItemCartao({
  pedido, item, margemMin, diasAlerta, selecionado,
  onSelecionar, onEditar, onVender, onApagar, onUploadFoto, onRemoverFoto, onZoom,
  templates = [], onTemplate,
}) {
  const input = useRef(null);
  const [aberto, setAberto] = useState(false); // dropdown de sugestões aberto

  // sugestões de itens antigos que casam com o que está escrito no nome
  const procura = item.nome.trim().toLowerCase();
  const sugestoes = procura
    ? templates
        .filter((t) => t.origemId !== item.id && t.nome.toLowerCase().includes(procura) && t.nome.toLowerCase() !== procura)
        .slice(0, 6)
    : [];

  const vendido = estaVendido(item);
  const m = margem(pedido, item);
  const dias = diasParaVender(pedido, item);
  const emStock = diasEmStock(pedido, item);
  const parado = !vendido && emStock !== null && emStock > diasAlerta;
  const minimo = precoMinimo(pedido, item, margemMin);
  const fotoUrl = item.foto ? `/api/fotos/${item.foto}` : null;
  const tamanhos = tamanhosPara(item.categoria);

  return (
    <div className={"item-cartao" + (selecionado ? " selecionado" : "") + (vendido ? " vendido" : "")}>
      <label className="item-check"><input type="checkbox" checked={selecionado} onChange={onSelecionar} /></label>

      <div className="item-foto">
        {fotoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoUrl} alt={item.nome || "foto"} onClick={() => onZoom(fotoUrl)} title="Ver maior" />
            <button className="foto-troca" onClick={() => input.current?.click()} title="Trocar">↻</button>
            <button className="foto-rem" onClick={onRemoverFoto} title="Remover">✕</button>
          </>
        ) : (
          <button className="foto-vazia" onClick={() => input.current?.click()}>📷<span>Adicionar foto</span></button>
        )}
        {parado && <span className="badge item-badge" title={`Parado há ${emStock} dias`}>⏳ {emStock}d</span>}
        <input ref={input} type="file" accept="image/*" hidden
          onChange={(e) => { if (e.target.files[0]) onUploadFoto(e.target.files[0]); e.target.value = ""; }} />
      </div>

      <div className="item-campos">
        <span className="td-nome">
          <span className="dot" style={{ background: corCategoria(item.categoria) }} />
          <span className="nome-wrap">
            <input
              className="item-nome" placeholder="ex: Brasil #10" value={item.nome}
              onChange={(e) => { onEditar("nome", e.target.value); setAberto(true); }}
              onFocus={() => setAberto(true)}
              onBlur={() => setTimeout(() => setAberto(false), 150)}
            />
            {aberto && sugestoes.length > 0 && (
              <div className="sugestoes">
                {sugestoes.map((t) => (
                  <button
                    type="button" className="sugestao" key={t.origemId}
                    onMouseDown={(e) => { e.preventDefault(); onTemplate(t.origemId); setAberto(false); }}
                  >
                    <span className="sugestao-foto" style={t.foto ? undefined : { background: corCategoria(t.categoria) }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {t.foto ? <img src={`/api/fotos/${t.foto}`} alt="" /> : (t.nome[0] || "?")}
                    </span>
                    <span className="sugestao-txt">
                      <span className="sugestao-nome">{t.nome}</span>
                      <span className="sugestao-sub">{t.categoria || "sem categoria"}{toNumber(t.precoCompra) > 0 ? ` · ${eur(toNumber(t.precoCompra))}` : ""}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </span>
        </span>
        <div className="item-linha">
          <input className="item-cat" list="categorias" placeholder="categoria" value={item.categoria} onChange={(e) => onEditar("categoria", e.target.value)} />
          {tamanhos.length > 0 && (
            <select className="item-tam" value={item.tamanho} onChange={(e) => onEditar("tamanho", e.target.value)}>
              <option value="">Tam.</option>
              {tamanhos.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        <div className="item-grid">
          <label><span>Compra €</span>
            <input className="num" type="number" step="0.01" value={item.precoCompra} onChange={(e) => onEditar("precoCompra", e.target.value)} /></label>
          <label><span>Venda €</span>
            <input className="num" type="number" step="0.01" value={item.precoVenda} onChange={(e) => onEditar("precoVenda", e.target.value)} /></label>
          <label><span>Data venda</span>
            <input type="date" value={item.dataVenda} onChange={(e) => onEditar("dataVenda", e.target.value)} /></label>
        </div>

        <input className="item-notas" placeholder="+ nota" value={item.notas} onChange={(e) => onEditar("notas", e.target.value)} />

        <div className="item-calc">
          <span className="dim">Custo {eur(custoReal(pedido, item))}</span>
          {m !== null
            ? <span className={m >= 0 ? "pos" : "neg"}>{eur(m)} · {margemPct(pedido, item)}%{dias !== null ? ` · ${dias}d` : ""}</span>
            : minimo !== null && <span className="dim">mín. {eur(minimo)}</span>}
        </div>

        <div className="item-acoes">
          {!vendido && <button className="btn mini vender" onClick={onVender}>€ Marcar vendido</button>}
          <button className="btn fantasma" title="Apagar item" onClick={onApagar}>✕</button>
        </div>
      </div>
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
