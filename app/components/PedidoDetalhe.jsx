"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEstado } from "./contexto";
import {
  eur, toNumber, custoReal, margem, margemPct, diasParaVender, diasEmStock,
  estaVendido, estaRecebido, precoMinimo, resumoPedido,
} from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";
import { tamanhosPara } from "@/lib/tamanhos";
import { useIdioma } from "./Idioma";
import ModalVenda from "./ModalVenda";
import ModalData from "./ModalData";
import Lightbox from "./Lightbox";
import SugestoesItem from "./SugestoesItem";
import Patches from "./Patches";

// Detalhe de um pedido: cabeçalho editável, resumo e os itens em cartões com
// foto grande. Reusa os handlers do contexto.
export default function PedidoDetalhe({ pedido }) {
  const router = useRouter();
  const { t } = useIdioma();
  const {
    estado, editarCampo, marcarVendido, marcarRecebido, novoItem, apagarItem, apagarPedido,
    uploadFoto, removerFoto, bulkEditar, aplicarTemplate,
    novoPatch, apagarPatch, uploadFotoPatch, confirmar,
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
  const [recebidoItem, setRecebidoItem] = useState(null); // item a marcar recebido (escolher data)
  const [zoom, setZoom] = useState(null); // src da foto em lightbox
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [catBulk, setCatBulk] = useState("");
  const [tamBulk, setTamBulk] = useState("");
  const [precoBulk, setPrecoBulk] = useState("");

  // Tamanhos possíveis para a seleção atual: união dos tamanhos das categorias
  // dos itens selecionados (categorias sem tamanhos não acrescentam nada).
  const tamanhosBulk = useMemo(() => {
    const set = new Set();
    for (const it of pedido.itens) {
      if (selecionados.has(it.id)) for (const tam of tamanhosPara(it.categoria)) set.add(tam);
    }
    return [...set];
  }, [pedido.itens, selecionados]);
  const todosSelecionados = pedido.itens.length > 0 && selecionados.size === pedido.itens.length;

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
  function alternarTodos() {
    setSelecionados((s) => (s.size === pedido.itens.length ? new Set() : new Set(pedido.itens.map((it) => it.id))));
  }
  function aplicarBulk() {
    const campos = {};
    if (catBulk.trim()) campos.categoria = catBulk.trim();
    if (tamBulk) campos.tamanho = tamBulk;
    if (precoBulk !== "") campos.precoCompra = precoBulk;
    bulkEditar([...selecionados], campos);
    setSelecionados(new Set());
    setCatBulk(""); setTamBulk(""); setPrecoBulk("");
  }

  // Colar (Cmd/Ctrl+V) uma imagem: se houver 1 item selecionado, vai para esse;
  // senão cria um item novo já com a foto. Um ref guarda os valores frescos para
  // o listener não precisar de ser re-registado a cada render.
  const colarRef = useRef(null);
  colarRef.current = { selecionados, pedido, novoItem, uploadFoto, uploadFotoPatch, confirmar, t };
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
      const { selecionados, pedido, novoItem, uploadFoto, uploadFotoPatch, confirmar, t } = colarRef.current;
      const patchId = document.activeElement?.dataset?.patchId;
      if (patchId) {
        // se o patch já tem foto, confirmar antes de trocar
        const patch = pedido.itens.flatMap((it) => it.patches || []).find((p) => p.id === patchId);
        if (patch?.foto && !(await pedirTrocaFoto(confirmar, t))) return;
        await uploadFotoPatch(patchId, ficheiro);
        return;
      }
      if (selecionados.size === 1) {
        const itemId = [...selecionados][0];
        const item = pedido.itens.find((it) => it.id === itemId);
        if (item?.foto && !(await pedirTrocaFoto(confirmar, t))) return; // já tem foto → perguntar
        await uploadFoto(itemId, ficheiro);
      } else {
        const novo = await novoItem(pedido.id);
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
          <button className="btn fantasma" title={t("det.apagarPedido")} onClick={aoApagarPedido}>{t("det.apagar")}</button>
        </div>

        <div className="pedido-meta">
          <label className="campo"><span>{t("contas.socio")}</span>
            <select value={pedido.socioId ?? ""} onChange={(e) => editP("socioId", e.target.value)}>
              <option value="">{t("filtros.sozinho")}</option>
              {socios.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select></label>
          <label className="campo"><span>{t("det.compra")}</span>
            <input type="date" value={pedido.dataCompra} onChange={(e) => editP("dataCompra", e.target.value)} /></label>
          <label className="campo"><span>{t("det.chegada")}</span>
            <input type="date" value={pedido.dataChegada} onChange={(e) => editP("dataChegada", e.target.value)} /></label>
          <label className="campo"><span>{t("det.taxaPaypal")}</span>
            <input className="num pequeno" type="number" step="0.01" value={pedido.taxaPaypal} onChange={(e) => editP("taxaPaypal", e.target.value)} /></label>
          <label className="campo"><span>{t("det.saco")}</span>
            <input className="num pequeno" type="number" step="0.01" value={pedido.saco} onChange={(e) => editP("saco", e.target.value)} /></label>
          <label className="campo"><span>{t("det.desconto")}</span>
            <div className="campo-desconto">
              <input className="num pequeno" type="number" step="0.01" min="0" value={pedido.desconto ?? 0} onChange={(e) => editP("desconto", e.target.value)} />
              <select value={pedido.descontoTipo || "pct"} onChange={(e) => editP("descontoTipo", e.target.value)} aria-label={t("det.desconto")}>
                <option value="pct">%</option>
                <option value="fixo">€</option>
              </select>
            </div></label>
        </div>

        <div className="pills">
          <Pill label={t("resumo.investido")} valor={eur(r.investido)} />
          <Pill label={t("det.vendidos")} valor={`${r.vendidos}/${r.total}`} />
          <Pill label={t("resumo.receita")} valor={eur(r.receita)} />
          <Pill label={t("vendas.lucro")} valor={eur(r.lucro)} azul />
          <Pill label={t("enc.margem")} valor={r.margemPct !== null ? `${r.margemPct}%` : "—"} />
          <Pill label={t("det.diasMedios")} valor={r.diasMedios !== null ? t("det.diasUnidade", { n: r.diasMedios }) : "—"} />
        </div>
      </div>

      {selecionados.size > 0 && (
        <div className="bulk-bar">
          <strong>{selecionados.size}</strong> {t("det.bulkResto")}
          <input list="categorias" value={catBulk} onChange={(e) => setCatBulk(e.target.value)} placeholder={t("det.phCategoria")} />
          {tamanhosBulk.length > 0 && (
            <select value={tamBulk} onChange={(e) => setTamBulk(e.target.value)} aria-label={t("det.tam")}>
              <option value="">{t("det.tam")}</option>
              {tamanhosBulk.map((tam) => <option key={tam} value={tam}>{tam}</option>)}
            </select>
          )}
          <input className="num" type="number" step="0.01" min="0" value={precoBulk}
            onChange={(e) => setPrecoBulk(e.target.value)} placeholder={t("det.compraItem")} />
          <button className="btn mini primario" onClick={aplicarBulk}>{t("det.aplicar")}</button>
          <button className="btn mini" onClick={() => setSelecionados(new Set())}>{t("filtros.limpar")}</button>
        </div>
      )}

      <div className="det-itens-topo">
        {pedido.itens.length > 0 && (
          <label className="sel-todos">
            <input type="checkbox" checked={todosSelecionados}
              ref={(el) => { if (el) el.indeterminate = selecionados.size > 0 && !todosSelecionados; }}
              onChange={alternarTodos} />
            <span>{t("det.selecionarTodos")}</span>
          </label>
        )}
        <p className="colar-dica">{t("det.colarDica")}</p>
      </div>

      <div className="itens-grelha">
        {pedido.itens.map((item) => (
          <ItemCartao
            key={item.id}
            pedido={pedido} item={item} margemMin={margemMin} diasAlerta={diasAlerta}
            selecionado={selecionados.has(item.id)}
            onSelecionar={() => alternar(item.id)}
            onEditar={(campo, valor) => editI(item.id, campo, valor)}
            onVender={() => setVendaItem(item)}
            onRecebido={() => setRecebidoItem(item)}
            onDesmarcarRecebido={() => marcarRecebido(pedido.id, item.id, "")}
            onApagar={() => apagarItem(pedido.id, item.id)}
            onUploadFoto={(f) => uploadFoto(item.id, f)}
            onRemoverFoto={() => removerFoto(item.id)}
            onZoom={(src) => setZoom(src)}
            templates={templates}
            onTemplate={(origemId) => aplicarTemplate(item.id, origemId)}
            onAddPatch={() => novoPatch({ itemId: item.id })}
            onEditarPatch={(id, nome) => editarCampo("patches", id, "nome", nome)}
            onApagarPatch={apagarPatch}
            onUploadFotoPatch={uploadFotoPatch}
          />
        ))}
        <button className="item-add" onClick={() => novoItem(pedido.id)}>{t("det.adicionarItem")}</button>
      </div>

      {vendaItem && (
        <ModalVenda
          item={vendaItem}
          sugestao={precoMinimo(pedido, vendaItem, margemMin)}
          onConfirmar={(preco, data) => { marcarVendido(pedido.id, vendaItem.id, preco, data); setVendaItem(null); }}
          onFechar={() => setVendaItem(null)}
        />
      )}
      {recebidoItem && (
        <ModalData
          titulo={t("vendas.tituloRecebido")}
          sub={recebidoItem.nome || t("comum.semNome")}
          rotulo={t("vendas.dataRecebido")}
          onConfirmar={(data) => { marcarRecebido(pedido.id, recebidoItem.id, data); setRecebidoItem(null); }}
          onFechar={() => setRecebidoItem(null)}
        />
      )}
      {zoom && <Lightbox src={zoom} onFechar={() => setZoom(null)} />}
    </article>
  );
}

function ItemCartao({
  pedido, item, margemMin, diasAlerta, selecionado,
  onSelecionar, onEditar, onVender, onRecebido, onDesmarcarRecebido, onApagar, onUploadFoto, onRemoverFoto, onZoom,
  templates = [], onTemplate,
  onAddPatch, onEditarPatch, onApagarPatch, onUploadFotoPatch,
}) {
  const { t } = useIdioma();
  const input = useRef(null);
  const vendido = estaVendido(item);
  const recebido = estaRecebido(item);
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
            <img src={fotoUrl} alt={item.nome || t("comum.foto")} onClick={() => onZoom(fotoUrl)} title={t("det.verMaior")} />
            <button className="foto-troca" onClick={() => input.current?.click()} title={t("det.trocar")}>↻</button>
            <button className="foto-rem" onClick={onRemoverFoto} title={t("comum.remover")}>✕</button>
          </>
        ) : (
          <button className="foto-vazia" onClick={() => input.current?.click()}>📷<span>{t("det.adicionarFoto")}</span></button>
        )}
        {parado && <span className="badge item-badge" title={t("det.paradoTitulo", { n: emStock })}>⏳ {emStock}d</span>}
        <input ref={input} type="file" accept="image/*" hidden
          onChange={(e) => { if (e.target.files[0]) onUploadFoto(e.target.files[0]); e.target.value = ""; }} />
      </div>

      <div className="item-campos">
        <span className="td-nome">
          <span className="dot" style={{ background: corCategoria(item.categoria) }} />
          <SugestoesItem
            value={item.nome} templates={templates} excluirId={item.id}
            onChange={(v) => onEditar("nome", v)} onEscolher={onTemplate}
          />
        </span>
        <div className="item-linha">
          <input className="item-cat" list="categorias" placeholder={t("det.phCategoria")} value={item.categoria} onChange={(e) => onEditar("categoria", e.target.value)} />
          {tamanhos.length > 0 && (
            <select className="item-tam" value={item.tamanho} onChange={(e) => onEditar("tamanho", e.target.value)}>
              <option value="">{t("det.tam")}</option>
              {tamanhos.map((tam) => <option key={tam} value={tam}>{tam}</option>)}
            </select>
          )}
        </div>

        <div className="item-grid">
          <label><span>{t("det.compraItem")}</span>
            <input className="num" type="number" step="0.01" value={item.precoCompra} onChange={(e) => onEditar("precoCompra", e.target.value)} /></label>
          <label><span>{t("det.vendaItem")}</span>
            <input className="num" type="number" step="0.01" value={item.precoVenda} onChange={(e) => onEditar("precoVenda", e.target.value)} /></label>
          <label><span>{t("det.dataVenda")}</span>
            <input type="date" value={item.dataVenda} onChange={(e) => onEditar("dataVenda", e.target.value)} /></label>
        </div>

        <input className="item-notas" placeholder={t("det.phNotaItem")} value={item.notas} onChange={(e) => onEditar("notas", e.target.value)} />

        <Patches
          patches={item.patches} onAdd={onAddPatch} onEditarNome={onEditarPatch}
          onApagar={onApagarPatch} onUploadFoto={onUploadFotoPatch}
        />

        <div className="item-calc">
          <span className="dim">{t("enc.custo")} {eur(custoReal(pedido, item))}</span>
          {m !== null
            ? <span className={m >= 0 ? "pos" : "neg"}>{eur(m)} · {margemPct(pedido, item)}%{dias !== null ? ` · ${dias}d` : ""}</span>
            : minimo !== null && <span className="dim">{t("det.min")} {eur(minimo)}</span>}
        </div>

        <div className="item-acoes">
          {!vendido && <button className="btn mini vender" onClick={onVender}>{t("det.marcarVendido")}</button>}
          {vendido && (
            recebido ? (
              <button className="btn mini fantasma" title={t("det.recebido")} onClick={onDesmarcarRecebido}>
                <span className="estado-venda pos">● {t("det.recebido")}</span>
              </button>
            ) : (
              <button className="btn mini" onClick={onRecebido}>
                <span className="estado-venda ambar">● {t("det.pendente")}</span> → {t("vendas.marcarRecebido")}
              </button>
            )
          )}
          <button className="btn fantasma" title={t("det.apagarItem")} onClick={onApagar}>✕</button>
        </div>
      </div>
    </div>
  );
}

// Pergunta antes de substituir uma foto que já existe (colar ⌘V).
function pedirTrocaFoto(confirmar, t) {
  return confirmar({
    titulo: t("conf.trocarFotoTitulo"),
    mensagem: t("conf.trocarFotoMsgItem"),
    textoConfirmar: t("conf.trocarFotoBtn"),
  });
}

function Pill({ label, valor, azul }) {
  return (
    <div className={"pill" + (azul ? " azul" : "")}>
      <div className="pill-label">{label}</div>
      <div className="pill-valor">{valor}</div>
    </div>
  );
}
