"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { toNumber } from "@/lib/calculos";
import Link from "next/link";
import { tamanhosPara } from "@/lib/tamanhos";
import { gerarPdf, textoEncomenda } from "@/lib/catalogo";
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

// Nova camisa: são sempre camisas de futebol; arranca com 1 unidade tamanho M.
const CAMISA_NOVA = { categoria: "Camisa de futebol", tamanhos: { M: 1 } };

// Total de peças de uma linha: soma da repartição por tamanho (S/M/L/XL) ou, em
// categorias sem tamanhos, a quantidade simples.
function totalDaLinha(l) {
  const sizes = tamanhosPara(l.categoria || "Camisa de futebol");
  if (sizes.length) return sizes.reduce((s, tam) => s + (Number(l.tamanhos?.[tam]) || 0), 0);
  return Math.max(1, Number(l.quantidade) || 1);
}

// Construtor de encomenda: vais juntando camisas (rascunho guardado) e no fim
// carregas em "Criar pedido" — cria o pedido com a quantidade expandida em itens.
export default function PaginaNovoPedido() {
  const router = useRouter();
  const { t } = useIdioma();
  const {
    estado, novaLinha, apagarLinha, uploadFotoLinha, aplicarTemplateLinha, editarCampo,
    finalizarRascunho, novoPatch, apagarPatch, uploadFotoPatch, confirmar,
  } = useEstado();
  const rascunho = estado.rascunho ?? [];
  const [pedido, setPedido] = useState(PEDIDO_INICIAL);
  const [aCriar, setACriar] = useState(false);
  const [criado, setCriado] = useState(null); // { pedidoId, waUrl } após "Criar pedido"
  // qual slot de foto (frente/verso de uma camisa) recebe o próximo ⌘V
  const [selFoto, setSelFoto] = useState(null); // { linhaId, lado } | null

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

  // colar imagem (⌘V): foco no nome de um patch → foto desse patch; slot de
  // foto selecionado (frente/verso) → essa foto; senão cria uma camisa nova.
  const refColar = useRef(null);
  refColar.current = { novaLinha, uploadFotoLinha, uploadFotoPatch, confirmar, rascunho, t, selFoto };
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
      const { novaLinha, uploadFotoLinha, uploadFotoPatch, confirmar, rascunho, t, selFoto } = refColar.current;
      const patchId = document.activeElement?.dataset?.patchId;
      if (patchId) {
        // se o patch já tem foto, confirmar antes de trocar
        const patch = rascunho.flatMap((l) => l.patches || []).find((p) => p.id === patchId);
        if (patch?.foto && !(await confirmar({ titulo: t("conf.trocarFotoTitulo"), mensagem: t("conf.trocarFotoMsgPatch"), textoConfirmar: t("conf.trocarFotoBtn") }))) return;
        await uploadFotoPatch(patchId, ficheiro);
        return;
      }
      // slot frente/verso selecionado → cola nesse (mesmo numa camisa já criada)
      if (selFoto) {
        const alvo = rascunho.find((l) => l.id === selFoto.linhaId);
        if (alvo) {
          const atual = selFoto.lado === "verso" ? alvo.fotoVerso : alvo.foto;
          if (atual && !(await confirmar({ titulo: t("conf.trocarFotoTitulo"), mensagem: t("conf.trocarFotoMsgItem"), textoConfirmar: t("conf.trocarFotoBtn") }))) return;
          await uploadFotoLinha(selFoto.linhaId, ficheiro, selFoto.lado);
          return;
        }
      }
      // sem slot selecionado: colar cria uma camisa nova com a foto na frente
      const linha = await novaLinha(CAMISA_NOVA);
      await uploadFotoLinha(linha.id, ficheiro, "frente");
    }
    window.addEventListener("paste", aoColar);
    return () => window.removeEventListener("paste", aoColar);
  }, []);

  const totalPecas = rascunho.reduce((n, l) => n + totalDaLinha(l), 0);
  const setP = (campo) => (e) => setPedido((f) => ({ ...f, [campo]: e.target.value }));

  const titulo = pedido.nome.trim() || t("comum.encomenda");
  const labelsPdf = () => ({ frente: t("novo.frente"), verso: t("novo.verso") });
  const nomePdf = () => `pedido-${new Date().toISOString().slice(0, 10)}.pdf`;

  async function descarregarPdf() {
    if (rascunho.length === 0) return;
    descarregar(await gerarPdf(rascunho, { titulo, labels: labelsPdf() }), nomePdf());
  }

  async function criarPedido() {
    if (rascunho.length === 0) return;
    setACriar(true);
    try {
      // 1) PDF (enquanto ainda temos as fotos frente/verso do rascunho)
      descarregar(await gerarPdf(rascunho, { titulo, labels: labelsPdf() }), nomePdf());
      const texto = textoEncomenda(rascunho, { titulo });
      const num = (estado.config.fornecedorWhats || "").replace(/\D/g, "");
      const waUrl = urlWhats(num, texto);
      // 2) cria o pedido (limpa o rascunho)
      const novo = await finalizarRascunho(pedido);
      // 3) tenta abrir o WhatsApp já; mostra painel de sucesso (com link de reserva)
      window.open(waUrl, "_blank");
      setCriado({ pedidoId: novo.id, waUrl });
    } catch (err) {
      alert(t("erro.criarPedido") + " " + err.message);
      setACriar(false);
    }
  }

  if (criado) {
    return (
      <div className="pagina">
        <section className="bloco">
          <div className="sucesso">
            <h2>{t("novo.criado")}</h2>
            <p className="dim">{t("novo.criadoMsg")}</p>
            <div className="criar-acoes">
              <a className="btn primario grande" href={criado.waUrl} target="_blank" rel="noreferrer">{t("novo.abrirWhats")}</a>
              <Link className="btn" href={`/pedidos/${criado.pedidoId}`}>{t("novo.verPedido")}</Link>
              <Link className="btn fantasma" href="/novo-pedido" onClick={() => setCriado(null)}>{t("pedidos.novoToggle")}</Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>{t("pedidos.novoToggle")} <span className="conta">{t("novo.sub")}</span></h2>

        <p className="colar-dica">{t("novo.colarDica")}</p>

        <div className="linhas">
          {rascunho.map((linha) => (
            <LinhaCamisa
              key={linha.id} linha={linha} templates={templates}
              onEditar={(campo, valor) => editarCampo("rascunho", linha.id, campo, valor)}
              onTemplate={(origemId) => aplicarTemplateLinha(linha.id, origemId)}
              onUploadFoto={(f, lado) => uploadFotoLinha(linha.id, f, lado)}
              selFoto={selFoto}
              onSelecionarFoto={(lado) =>
                setSelFoto((s) =>
                  s && s.linhaId === linha.id && s.lado === lado
                    ? null
                    : { linhaId: linha.id, lado },
                )
              }
              onApagar={() => apagarLinha(linha.id)}
              onAddPatch={() => novoPatch({ linhaId: linha.id })}
              onEditarPatch={(id, nome) => editarCampo("patches", id, "nome", nome)}
              onApagarPatch={apagarPatch}
              onUploadFotoPatch={uploadFotoPatch}
            />
          ))}
          <button className="item-add" onClick={() => novaLinha(CAMISA_NOVA)}>{t("novo.adicionarCamisa")}</button>
        </div>
      </section>

      {rascunho.length > 0 && (
        <section className="bloco">
          <h2>{t("novo.finalizar")} <span className="conta">{t("novo.finalizarSub", { n: rascunho.length, p: totalPecas })}</span></h2>
          <div className="form-novo">
            <label className="campo"><span>{t("novo.nomePedido")}</span>
              <input value={pedido.nome} onChange={setP("nome")} placeholder={t("novo.phNome")} /></label>
            <label className="campo"><span>{t("contas.socio")}</span>
              <select value={pedido.socioId} onChange={setP("socioId")}>
                <option value="">{t("filtros.sozinho")}</option>
                {estado.socios.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select></label>
            <label className="campo"><span>{t("novo.dataCompra")}</span>
              <input type="date" value={pedido.dataCompra} onChange={setP("dataCompra")} /></label>
            <label className="campo"><span>{t("novo.dataChegada")}</span>
              <input type="date" value={pedido.dataChegada} onChange={setP("dataChegada")} /></label>
            <label className="campo"><span>{t("novo.taxaPaypal")}</span>
              <input className="num" type="number" step="0.01" value={pedido.taxaPaypal} onChange={setP("taxaPaypal")} /></label>
            <label className="campo"><span>{t("novo.saco")}</span>
              <input className="num" type="number" step="0.01" value={pedido.saco} onChange={setP("saco")} /></label>
          </div>
          <div className="criar-acoes">
            <button className="btn primario grande" onClick={criarPedido} disabled={aCriar}>
              {aCriar ? t("novo.aCriar") : t("novo.criarPedidoN", { n: totalPecas })}
            </button>
            <button className="btn" onClick={descarregarPdf}>{t("novo.descarregarPdf")}</button>
            <button className="btn" onClick={() => { navigator.clipboard?.writeText(textoEncomenda(rascunho, { titulo })); }}>{t("novo.copiarTexto")}</button>
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

// Slot de foto (frente ou verso). Clicar seleciona o slot (fica com contorno)
// para o próximo ⌘V cair aqui; o botãozinho ⤓ carrega uma foto de ficheiro.
function FotoSlot({ url, rotulo, onPick, onSelecionar, selecionado, nome, t }) {
  const input = useRef(null);
  return (
    <div className="linha-foto-wrap">
      <span className="linha-foto-rotulo">{rotulo}</span>
      <div
        className={"linha-foto" + (selecionado ? " selecionada" : "")}
        onClick={onSelecionar}
        title={selecionado ? t("novo.fotoSelecionada") : t("novo.selecionarFoto")}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={nome || t("comum.foto")} />
        ) : (
          <span className="foto-vazia">📷<span>{rotulo}</span></span>
        )}
        <button type="button" className="foto-upload" title={t("novo.carregarFoto")}
          onClick={(e) => { e.stopPropagation(); input.current?.click(); }}>⤓</button>
        <input ref={input} type="file" accept="image/*" hidden
          onChange={(e) => { if (e.target.files[0]) onPick(e.target.files[0]); e.target.value = ""; }} />
      </div>
    </div>
  );
}

function LinhaCamisa({
  linha, templates, onEditar, onTemplate, onUploadFoto, onApagar,
  onAddPatch, onEditarPatch, onApagarPatch, onUploadFotoPatch,
  selFoto, onSelecionarFoto,
}) {
  const { t } = useIdioma();
  const tamanhos = tamanhosPara(linha.categoria || "Camisa de futebol");
  const mapa = linha.tamanhos || {};
  const total = tamanhos.length
    ? tamanhos.reduce((s, tam) => s + (Number(mapa[tam]) || 0), 0)
    : Math.max(1, Number(linha.quantidade) || 1);

  // muda a quantidade de um tamanho na repartição {tam:qtd}
  function setTamanho(tam, valor) {
    const n = Math.max(0, Math.round(Number(valor) || 0));
    const novo = { ...mapa };
    if (n > 0) novo[tam] = n; else delete novo[tam];
    onEditar("tamanhos", novo);
  }

  return (
    <div className="linha-camisa">
      <div className="linha-fotos">
        <FotoSlot url={linha.foto ? `/api/fotos/${linha.foto}` : null} rotulo={t("novo.frente")}
          nome={linha.nome} t={t} onPick={(f) => onUploadFoto(f, "frente")}
          selecionado={selFoto?.linhaId === linha.id && selFoto?.lado === "frente"}
          onSelecionar={() => onSelecionarFoto("frente")} />
        <FotoSlot url={linha.fotoVerso ? `/api/fotos/${linha.fotoVerso}` : null} rotulo={t("novo.verso")}
          nome={linha.nome} t={t} onPick={(f) => onUploadFoto(f, "verso")}
          selecionado={selFoto?.linhaId === linha.id && selFoto?.lado === "verso"}
          onSelecionar={() => onSelecionarFoto("verso")} />
      </div>

      <div className="linha-campos">
        <span className="td-nome">
          <span className="dot" style={{ background: "var(--accent)" }} />
          <SugestoesItem
            value={linha.nome} templates={templates} excluirId={linha.id}
            onChange={(v) => onEditar("nome", v)} onEscolher={onTemplate} placeholder={t("comum.nome")}
          />
        </span>

        {tamanhos.length ? (
          <div className="tamanhos-grid">
            <span className="tamanhos-label">{t("novo.tamanhosLabel")}</span>
            {tamanhos.map((tam) => (
              <label key={tam} className="tam-celula">
                <span>{tam}</span>
                <input className="num" type="number" min="0" step="1" placeholder="0"
                  value={mapa[tam] ?? ""} onChange={(e) => setTamanho(tam, e.target.value)} />
              </label>
            ))}
            <span className="tam-total">{t("novo.totalLinha", { n: total })}</span>
          </div>
        ) : (
          <div className="linha-grid">
            <label><span>{t("novo.quantidade")}</span>
              <input className="num" type="number" min="1" step="1" value={linha.quantidade}
                onChange={(e) => onEditar("quantidade", e.target.value)} /></label>
          </div>
        )}

        <Patches
          patches={linha.patches} onAdd={onAddPatch} onEditarNome={onEditarPatch}
          onApagar={onApagarPatch} onUploadFoto={onUploadFotoPatch}
        />
      </div>

      <button className="btn fantasma linha-x" title={t("novo.removerCamisa")} onClick={onApagar}>✕</button>
    </div>
  );
}
