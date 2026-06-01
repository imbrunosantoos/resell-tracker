"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEstado } from "@/app/components/contexto";
import { toNumber } from "@/lib/calculos";
import Link from "next/link";
import { tamanhosPara } from "@/lib/tamanhos";
import { gerarCatalogo, textoEncomenda } from "@/lib/catalogo";
import SugestoesItem from "@/app/components/SugestoesItem";
import Patches from "@/app/components/Patches";

function descarregar(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const urlWhats = (num, texto) =>
  num ? `https://wa.me/${num}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`;

const PEDIDO_INICIAL = { nome: "", socioId: "", dataCompra: "", dataChegada: "", taxaPaypal: "3.99", saco: "0.17" };

// Construtor de encomenda: vais juntando camisas (rascunho guardado) e no fim
// carregas em "Criar pedido" — cria o pedido com a quantidade expandida em itens.
export default function PaginaNovoPedido() {
  const router = useRouter();
  const {
    estado, novaLinha, apagarLinha, uploadFotoLinha, aplicarTemplateLinha, editarCampo,
    finalizarRascunho, novoPatch, apagarPatch, uploadFotoPatch,
  } = useEstado();
  const rascunho = estado.rascunho ?? [];
  const [pedido, setPedido] = useState(PEDIDO_INICIAL);
  const [aCriar, setACriar] = useState(false);
  const [criado, setCriado] = useState(null); // { pedidoId, waUrl } após "Criar pedido"

  // templates para o autofill (itens já existentes, distintos por nome)
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
          porNome.set(chave, { pontos, origemId: it.id, nome, categoria: it.categoria, precoCompra: it.precoCompra, foto: it.foto });
        }
      }
    }
    return [...porNome.values()];
  }, [estado.pedidos]);

  // colar imagem (⌘V): se o foco estiver no nome de um patch → foto desse patch;
  // senão cria uma camisa nova com a foto.
  const refColar = useRef(null);
  refColar.current = { novaLinha, uploadFotoLinha, uploadFotoPatch };
  useEffect(() => {
    async function aoColar(e) {
      const itens = e.clipboardData?.items;
      if (!itens) return;
      let ficheiro = null;
      for (const it of itens) {
        if (it.kind === "file" && it.type.startsWith("image/")) { ficheiro = it.getAsFile(); break; }
      }
      if (!ficheiro) return;
      e.preventDefault();
      const { novaLinha, uploadFotoLinha, uploadFotoPatch } = refColar.current;
      const patchId = document.activeElement?.dataset?.patchId;
      if (patchId) { await uploadFotoPatch(patchId, ficheiro); return; }
      const linha = await novaLinha({ categoria: "Camisa de futebol" });
      await uploadFotoLinha(linha.id, ficheiro);
    }
    window.addEventListener("paste", aoColar);
    return () => window.removeEventListener("paste", aoColar);
  }, []);

  const totalPecas = rascunho.reduce((n, l) => n + Math.max(1, l.quantidade || 1), 0);
  const setP = (campo) => (e) => setPedido((f) => ({ ...f, [campo]: e.target.value }));

  const titulo = pedido.nome.trim() || "Encomenda";

  async function preverImagem() {
    if (rascunho.length === 0) return;
    descarregar(await gerarCatalogo(rascunho, { titulo }), `encomenda-${new Date().toISOString().slice(0, 10)}.png`);
  }

  async function criarPedido() {
    if (rascunho.length === 0) return;
    setACriar(true);
    try {
      // 1) imagem-catálogo (enquanto ainda temos as fotos do rascunho)
      descarregar(await gerarCatalogo(rascunho, { titulo }), `encomenda-${new Date().toISOString().slice(0, 10)}.png`);
      const texto = textoEncomenda(rascunho, { titulo });
      const num = (estado.config.fornecedorWhats || "").replace(/\D/g, "");
      const waUrl = urlWhats(num, texto);
      // 2) cria o pedido (limpa o rascunho)
      const novo = await finalizarRascunho(pedido);
      // 3) tenta abrir o WhatsApp já; mostra painel de sucesso (com link de reserva)
      window.open(waUrl, "_blank");
      setCriado({ pedidoId: novo.id, waUrl });
    } catch (err) {
      alert("Não foi possível criar o pedido: " + err.message);
      setACriar(false);
    }
  }

  if (criado) {
    return (
      <div className="pagina">
        <section className="bloco">
          <div className="sucesso">
            <h2>Pedido criado ✓</h2>
            <p className="dim">A imagem-catálogo foi descarregada. Anexa-a no WhatsApp e envia o texto ao fornecedor.</p>
            <div className="criar-acoes">
              <a className="btn primario grande" href={criado.waUrl} target="_blank" rel="noreferrer">📲 Abrir WhatsApp do fornecedor</a>
              <Link className="btn" href={`/pedidos/${criado.pedidoId}`}>Ver o pedido criado</Link>
              <Link className="btn fantasma" href="/novo-pedido" onClick={() => setCriado(null)}>Novo pedido</Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>Novo pedido <span className="conta">— junta as camisas e cria tudo de uma vez</span></h2>

        <p className="colar-dica">📋 Cola uma imagem (⌘V) para criar uma camisa com a foto, ou usa o botão abaixo. Escreve o nome para reaproveitar fotos/preços de camisas que já tens.</p>

        <div className="linhas">
          {rascunho.map((linha) => (
            <LinhaCamisa
              key={linha.id} linha={linha} templates={templates}
              onEditar={(campo, valor) => editarCampo("rascunho", linha.id, campo, valor)}
              onTemplate={(origemId) => aplicarTemplateLinha(linha.id, origemId)}
              onUploadFoto={(f) => uploadFotoLinha(linha.id, f)}
              onApagar={() => apagarLinha(linha.id)}
              onAddPatch={() => novoPatch({ linhaId: linha.id })}
              onEditarPatch={(id, nome) => editarCampo("patches", id, "nome", nome)}
              onApagarPatch={apagarPatch}
              onUploadFotoPatch={uploadFotoPatch}
            />
          ))}
          <button className="item-add" onClick={() => novaLinha({ categoria: "Camisa de futebol" })}>+ Adicionar camisa</button>
        </div>
      </section>

      {rascunho.length > 0 && (
        <section className="bloco">
          <h2>Finalizar <span className="conta">— {rascunho.length} modelo(s) · {totalPecas} peça(s)</span></h2>
          <div className="form-novo">
            <label className="campo"><span>Nome do pedido</span>
              <input value={pedido.nome} onChange={setP("nome")} placeholder="ex: Lote 03 — futebol" /></label>
            <label className="campo"><span>Sócio</span>
              <select value={pedido.socioId} onChange={setP("socioId")}>
                <option value="">Sozinho</option>
                {estado.socios.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select></label>
            <label className="campo"><span>Data compra</span>
              <input type="date" value={pedido.dataCompra} onChange={setP("dataCompra")} /></label>
            <label className="campo"><span>Data chegada</span>
              <input type="date" value={pedido.dataChegada} onChange={setP("dataChegada")} /></label>
            <label className="campo"><span>Taxa PayPal (€)</span>
              <input className="num" type="number" step="0.01" value={pedido.taxaPaypal} onChange={setP("taxaPaypal")} /></label>
            <label className="campo"><span>Saco / peça (€)</span>
              <input className="num" type="number" step="0.01" value={pedido.saco} onChange={setP("saco")} /></label>
          </div>
          <div className="criar-acoes">
            <button className="btn primario grande" onClick={criarPedido} disabled={aCriar}>
              {aCriar ? "A criar…" : `Criar pedido (${totalPecas} peças)`}
            </button>
            <button className="btn" onClick={preverImagem}>Pré-ver imagem-catálogo</button>
            <button className="btn" onClick={() => { navigator.clipboard?.writeText(textoEncomenda(rascunho, { titulo })); }}>Copiar texto</button>
          </div>
        </section>
      )}

      <datalist id="categorias">
        <option value="Camisa de futebol" />
        <option value="Polo" />
        <option value="Relógio" />
        <option value="Camisola" />
        <option value="Acessório" />
      </datalist>
    </div>
  );
}

function LinhaCamisa({
  linha, templates, onEditar, onTemplate, onUploadFoto, onApagar,
  onAddPatch, onEditarPatch, onApagarPatch, onUploadFotoPatch,
}) {
  const input = useRef(null);
  const tamanhos = tamanhosPara(linha.categoria || "Camisa de futebol");
  const fotoUrl = linha.foto ? `/api/fotos/${linha.foto}` : null;

  return (
    <div className="linha-camisa">
      <div className="linha-foto">
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt={linha.nome || "foto"} onClick={() => input.current?.click()} title="Trocar foto" />
        ) : (
          <button className="foto-vazia" onClick={() => input.current?.click()}>📷<span>Foto</span></button>
        )}
        <input ref={input} type="file" accept="image/*" hidden
          onChange={(e) => { if (e.target.files[0]) onUploadFoto(e.target.files[0]); e.target.value = ""; }} />
      </div>

      <div className="linha-campos">
        <span className="td-nome">
          <span className="dot" style={{ background: "var(--accent)" }} />
          <SugestoesItem
            value={linha.nome} templates={templates} excluirId={linha.id}
            onChange={(v) => onEditar("nome", v)} onEscolher={onTemplate} placeholder="Nome"
          />
          <select className="item-tam" value={linha.tamanho} onChange={(e) => onEditar("tamanho", e.target.value)}>
            <option value="">Tam.</option>
            {tamanhos.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </span>
        <div className="linha-grid">
          <label><span>Quantidade</span>
            <input className="num" type="number" min="1" step="1" value={linha.quantidade}
              onChange={(e) => onEditar("quantidade", e.target.value)} /></label>
          <label><span>Compra € (opc.)</span>
            <input className="num" type="number" step="0.01" value={linha.precoCompra}
              onChange={(e) => onEditar("precoCompra", e.target.value)} /></label>
        </div>
        <Patches
          patches={linha.patches} onAdd={onAddPatch} onEditarNome={onEditarPatch}
          onApagar={onApagarPatch} onUploadFoto={onUploadFotoPatch}
        />
      </div>

      <button className="btn fantasma linha-x" title="Remover camisa" onClick={onApagar}>✕</button>
    </div>
  );
}
