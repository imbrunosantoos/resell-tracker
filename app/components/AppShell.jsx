"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resumoGlobal, categoriasOrdenadas, dadosMensais, relatorioMensal, estaVendido } from "@/lib/calculos";
import { EstadoContexto } from "./contexto";
import { prepararImagem } from "./prepararImagem";
import TopNav from "./TopNav";
import ModalConfirmar from "./ModalConfirmar";

/* O AppShell é o dono do estado do negócio. Vive no layout do grupo (app), por
   isso sobrevive à navegação entre páginas — o estado e o polling mantêm-se.
   Toda a lógica que antes estava no Dashboard está aqui, exposta por contexto. */
export default function AppShell({ utilizador, estadoInicial, children }) {
  const router = useRouter();
  // As credenciais não vêm no estado inicial (carregam-se só na aba Contas).
  const [estado, setEstado] = useState(() => ({ ...estadoInicial, credenciais: [], rascunho: estadoInicial.rascunho ?? [] }));

  const timers = useRef({}); // debounce por campo
  const pendentes = useRef(0); // nº de escritas por confirmar
  const credsCarregadas = useRef(false);

  // Toast de erro (aparece quando uma escrita falha) e modal de confirmação.
  const [erro, setErro] = useState(null);
  const erroTimer = useRef(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const confirmarResolve = useRef(null);

  function mostrarErro(msg) {
    setErro(msg);
    clearTimeout(erroTimer.current);
    erroTimer.current = setTimeout(() => setErro(null), 4500);
  }

  // Pergunta "tens a certeza?" num modal centrado; devolve Promise<boolean>.
  function confirmar(opcoes) {
    return new Promise((resolve) => {
      confirmarResolve.current = resolve;
      setConfirmacao(opcoes);
    });
  }
  function responderConfirmacao(ok) {
    setConfirmacao(null);
    const resolve = confirmarResolve.current;
    confirmarResolve.current = null;
    resolve?.(ok);
  }

  // Conta uma escrita como pendente enquanto corre (para o polling não recarregar
  // por cima de uma alteração otimista que ainda não foi confirmada pelo servidor).
  async function comEscrita(fn) {
    pendentes.current++;
    try { return await fn(); }
    finally { pendentes.current--; }
  }

  // ---------- Sincronização (apanha alterações do sócio) ----------
  async function recarregar() {
    if (pendentes.current > 0) return; // há escritas por confirmar — não mexer
    const r = await fetch("/api/estado");
    if (!r.ok) return;
    const nova = await r.json();
    // Se começou uma escrita durante o fetch, este snapshot já está velho: descarta.
    if (pendentes.current > 0) return;
    // /api/estado já não traz as credenciais — preservar as que já carregámos.
    setEstado((prev) => ({ ...nova, credenciais: prev.credenciais }));
  }

  // Carrega as credenciais à parte (chamado pela aba Contas, uma vez).
  async function carregarCredenciais() {
    if (credsCarregadas.current) return;
    credsCarregadas.current = true;
    const r = await fetch("/api/credenciais");
    if (r.ok) { const credenciais = await r.json(); setEstado((prev) => ({ ...prev, credenciais })); }
    else credsCarregadas.current = false; // deixa tentar de novo
  }
  useEffect(() => {
    const intervalo = setInterval(() => {
      const aEscrever = pendentes.current > 0;
      const aEditar = document.activeElement?.closest?.("input, select, textarea");
      if (!aEscrever && !aEditar) recarregar();
    }, 20_000);
    return () => clearInterval(intervalo);
  }, []);

  // ---------- Persistência ----------
  function persistir(url, metodo, corpo) {
    return fetch(url, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  }

  // Edição otimista + debounce. `tabela`: pedidos | itens | despesas | socios | credenciais.
  function editarCampo(tabela, id, campo, valor) {
    setEstado((prev) => aplicarCampoLocal(prev, tabela, id, campo, valor));
    const chave = `${tabela}:${id}:${campo}`;
    clearTimeout(timers.current[chave]);
    pendentes.current++;
    timers.current[chave] = setTimeout(async () => {
      try {
        const r = await persistir(`/api/${tabela}/${id}`, "PATCH", { [campo]: valor });
        if (!r.ok) { mostrarErro("Não foi possível guardar a alteração."); recarregar(); }
      } catch { mostrarErro("Sem ligação ao servidor."); }
      finally { pendentes.current--; }
    }, 450);
  }

  function editarConfig(campo, valor) {
    setEstado((prev) => ({ ...prev, config: { ...prev.config, [campo]: valor } }));
    const chave = `config:${campo}`;
    clearTimeout(timers.current[chave]);
    pendentes.current++;
    timers.current[chave] = setTimeout(async () => {
      try {
        const r = await persistir("/api/config", "PATCH", { [campo]: valor });
        if (!r.ok) { mostrarErro("Não foi possível guardar a configuração."); recarregar(); }
      } catch { mostrarErro("Sem ligação ao servidor."); }
      finally { pendentes.current--; }
    }, 450);
  }

  // ---------- Pedidos / itens ----------
  async function novoPedido(dados) {
    return comEscrita(async () => {
      const r = await persistir("/api/pedidos", "POST", dados);
      if (!r.ok) { mostrarErro("Não foi possível criar o pedido."); return null; }
      const pedido = await r.json();
      setEstado((prev) => ({ ...prev, pedidos: [pedido, ...prev.pedidos] }));
      return pedido;
    });
  }
  async function apagarPedido(id) {
    const ok = await confirmar({
      titulo: "Apagar pedido",
      mensagem: "Isto apaga o pedido e todos os seus itens. Não dá para desfazer.",
      textoConfirmar: "Apagar",
      perigo: true,
    });
    if (!ok) return false;
    return comEscrita(async () => {
      const r = await persistir(`/api/pedidos/${id}`, "DELETE");
      if (!r.ok) { mostrarErro("Não foi possível apagar o pedido."); recarregar(); return false; }
      setEstado((prev) => ({ ...prev, pedidos: prev.pedidos.filter((p) => p.id !== id) }));
      return true;
    });
  }
  async function novoItem(pedidoId) {
    return comEscrita(async () => {
      const r = await persistir("/api/itens", "POST", { pedidoId });
      if (!r.ok) { mostrarErro("Não foi possível adicionar o item."); return null; }
      const item = await r.json();
      setEstado((prev) => ({
        ...prev,
        pedidos: prev.pedidos.map((p) => (p.id === pedidoId ? { ...p, itens: [...p.itens, item] } : p)),
      }));
      return item;
    });
  }
  async function apagarItem(pedidoId, itemId) {
    return comEscrita(async () => {
      const r = await persistir(`/api/itens/${itemId}`, "DELETE");
      if (!r.ok) { mostrarErro("Não foi possível apagar o item."); recarregar(); return; }
      setEstado((prev) => ({
        ...prev,
        pedidos: prev.pedidos.map((p) => (p.id === pedidoId ? { ...p, itens: p.itens.filter((i) => i.id !== itemId) } : p)),
      }));
    });
  }
  async function marcarVendido(pedidoId, itemId, precoVenda, dataVenda) {
    return comEscrita(async () => {
      setEstado((prev) => substituirItemCampos(prev, pedidoId, itemId, { precoVenda, dataVenda }));
      const r = await persistir(`/api/itens/${itemId}`, "PATCH", { precoVenda, dataVenda });
      if (!r.ok) { mostrarErro("Não foi possível guardar a venda."); recarregar(); }
    });
  }
  // Autofill: preenche um item a partir de outro (copia nome/categoria/preço + foto).
  async function aplicarTemplate(itemId, origemId) {
    return comEscrita(async () => {
      const r = await persistir(`/api/itens/${itemId}/template`, "POST", { origemId });
      if (!r.ok) { mostrarErro("Não foi possível copiar do item anterior."); return; }
      const item = await r.json();
      setEstado((prev) => substituirItem(prev, item));
    });
  }
  async function bulkCategoria(ids, categoria) {
    if (ids.length === 0) return;
    return comEscrita(async () => {
      const r = await persistir("/api/itens/categoria", "POST", { ids, categoria });
      if (!r.ok) { mostrarErro("Não foi possível mudar a categoria."); recarregar(); return; }
      setEstado((prev) => ({
        ...prev,
        pedidos: prev.pedidos.map((p) => ({
          ...p,
          itens: p.itens.map((it) => (ids.includes(it.id) ? { ...it, categoria } : it)),
        })),
      }));
    });
  }

  // ---------- Fotos ----------
  async function uploadFoto(itemId, ficheiro) {
    return comEscrita(async () => {
      const otimizada = await prepararImagem(ficheiro); // encolhe + converte HEIC→JPEG
      const fd = new FormData();
      fd.append("foto", otimizada);
      const r = await fetch(`/api/itens/${itemId}/foto`, { method: "POST", body: fd });
      if (!r.ok) { mostrarErro("Não foi possível guardar a foto."); return; }
      const item = await r.json();
      setEstado((prev) => substituirItem(prev, item));
    });
  }
  async function removerFoto(itemId) {
    const ok = await confirmar({
      titulo: "Remover foto",
      mensagem: "Remover a foto deste item?",
      textoConfirmar: "Remover",
      perigo: true,
    });
    if (!ok) return;
    return comEscrita(async () => {
      const r = await persistir(`/api/itens/${itemId}/foto`, "DELETE");
      if (!r.ok) { mostrarErro("Não foi possível remover a foto."); recarregar(); return; }
      const item = await r.json();
      setEstado((prev) => substituirItem(prev, item));
    });
  }

  // ---------- Rascunho de encomenda (aba Novo Pedido) ----------
  async function novaLinha(dados = {}) {
    return comEscrita(async () => {
      const r = await persistir("/api/rascunho", "POST", dados);
      if (!r.ok) { mostrarErro("Não foi possível adicionar a camisa."); return null; }
      const linha = await r.json();
      setEstado((prev) => ({ ...prev, rascunho: [...(prev.rascunho ?? []), linha] }));
      return linha;
    });
  }
  async function apagarLinha(id) {
    return comEscrita(async () => {
      const r = await persistir(`/api/rascunho/${id}`, "DELETE");
      if (!r.ok) { mostrarErro("Não foi possível remover a camisa."); recarregar(); return; }
      setEstado((prev) => ({ ...prev, rascunho: prev.rascunho.filter((l) => l.id !== id) }));
    });
  }
  async function uploadFotoLinha(linhaId, ficheiro) {
    return comEscrita(async () => {
      const otimizada = await prepararImagem(ficheiro);
      const fd = new FormData();
      fd.append("foto", otimizada);
      const r = await fetch(`/api/rascunho/${linhaId}/foto`, { method: "POST", body: fd });
      if (!r.ok) { mostrarErro("Não foi possível guardar a foto."); return; }
      const linha = await r.json();
      setEstado((prev) => ({ ...prev, rascunho: prev.rascunho.map((l) => (l.id === linha.id ? linha : l)) }));
    });
  }
  async function aplicarTemplateLinha(linhaId, origemId) {
    return comEscrita(async () => {
      const r = await persistir(`/api/rascunho/${linhaId}/template`, "POST", { origemId });
      if (!r.ok) { mostrarErro("Não foi possível copiar do item anterior."); return; }
      const linha = await r.json();
      setEstado((prev) => ({ ...prev, rascunho: prev.rascunho.map((l) => (l.id === linha.id ? linha : l)) }));
    });
  }
  // "Criar pedido": cria o pedido a partir do rascunho e devolve-o (já com itens).
  async function finalizarRascunho(dadosPedido) {
    return comEscrita(async () => {
      const r = await persistir("/api/rascunho/finalizar", "POST", dadosPedido);
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro || "Não foi possível criar o pedido.");
      setEstado((prev) => ({ ...prev, rascunho: [], pedidos: [dados, ...prev.pedidos] }));
      return dados;
    });
  }

  // ---------- Patches (de um item ou de uma linha do rascunho) ----------
  async function novoPatch(alvo) {
    // alvo: { itemId } ou { linhaId }
    return comEscrita(async () => {
      const r = await persistir("/api/patches", "POST", alvo);
      if (!r.ok) { mostrarErro("Não foi possível adicionar o patch."); return; }
      const patch = await r.json();
      setEstado((prev) => adicionarPatch(prev, patch));
    });
  }
  async function apagarPatch(patch) {
    return comEscrita(async () => {
      const r = await persistir(`/api/patches/${patch.id}`, "DELETE");
      if (!r.ok) { mostrarErro("Não foi possível remover o patch."); recarregar(); return; }
      setEstado((prev) => removerPatch(prev, patch));
    });
  }
  async function uploadFotoPatch(patchId, ficheiro) {
    return comEscrita(async () => {
      const otimizada = await prepararImagem(ficheiro);
      const fd = new FormData();
      fd.append("foto", otimizada);
      const r = await fetch(`/api/patches/${patchId}/foto`, { method: "POST", body: fd });
      if (!r.ok) { mostrarErro("Não foi possível guardar a foto do patch."); return; }
      const patch = await r.json();
      setEstado((prev) => substituirPatch(prev, patch));
    });
  }

  // ---------- Sócios ----------
  async function novoSocio(dados) {
    return comEscrita(async () => {
      const r = await persistir("/api/socios", "POST", dados);
      if (!r.ok) { mostrarErro("Não foi possível criar o sócio."); return; }
      const socio = await r.json();
      setEstado((prev) => ({ ...prev, socios: [...prev.socios, socio] }));
    });
  }
  async function apagarSocio(id) {
    const ok = await confirmar({
      titulo: "Apagar sócio",
      mensagem: "Os pedidos dele passam a 'sozinho'. Tens a certeza?",
      textoConfirmar: "Apagar",
      perigo: true,
    });
    if (!ok) return;
    return comEscrita(async () => {
      const r = await persistir(`/api/socios/${id}`, "DELETE");
      if (!r.ok) { mostrarErro("Não foi possível apagar o sócio."); recarregar(); return; }
      setEstado((prev) => ({
        ...prev,
        socios: prev.socios.filter((s) => s.id !== id),
        pedidos: prev.pedidos.map((p) => (p.socioId === id ? { ...p, socioId: null } : p)),
        credenciais: prev.credenciais.map((c) => (c.socioId === id ? { ...c, socioId: null } : c)),
      }));
    });
  }

  // ---------- Despesas ----------
  async function novaDespesa(dados) {
    return comEscrita(async () => {
      const r = await persistir("/api/despesas", "POST", dados);
      if (!r.ok) { mostrarErro("Não foi possível criar a despesa."); return; }
      const despesa = await r.json();
      setEstado((prev) => ({ ...prev, despesas: [...prev.despesas, despesa] }));
    });
  }
  async function apagarDespesa(id) {
    return comEscrita(async () => {
      const r = await persistir(`/api/despesas/${id}`, "DELETE");
      if (!r.ok) { mostrarErro("Não foi possível apagar a despesa."); recarregar(); return; }
      setEstado((prev) => ({ ...prev, despesas: prev.despesas.filter((d) => d.id !== id) }));
    });
  }

  // ---------- Credenciais ----------
  async function novaCredencial(dados) {
    return comEscrita(async () => {
      const r = await persistir("/api/credenciais", "POST", dados);
      if (!r.ok) { mostrarErro("Não foi possível guardar a conta."); return; }
      const credencial = await r.json();
      setEstado((prev) => ({ ...prev, credenciais: [...prev.credenciais, credencial] }));
    });
  }
  async function apagarCredencial(id) {
    return comEscrita(async () => {
      const r = await persistir(`/api/credenciais/${id}`, "DELETE");
      if (!r.ok) { mostrarErro("Não foi possível apagar a conta."); recarregar(); return; }
      setEstado((prev) => ({ ...prev, credenciais: prev.credenciais.filter((c) => c.id !== id) }));
    });
  }

  // ---------- Backup / sessão ----------
  function exportar(formato) {
    window.location.href = `/api/exportar?formato=${formato}`;
  }
  async function importar(ficheiro) {
    if (!ficheiro) return;
    if (!confirm("Importar substitui os dados do negócio (pedidos, despesas, sócios). Continuar?")) return;
    try {
      const r = await persistir("/api/importar", "POST", JSON.parse(await ficheiro.text()));
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro || "Ficheiro inválido.");
      setEstado(dados);
    } catch (err) {
      alert("Não foi possível importar: " + err.message);
    }
  }
  async function sair() {
    await persistir("/api/auth/logout", "POST");
    router.replace("/login");
    router.refresh();
  }

  // ---------- Derivados ----------
  const resumo = useMemo(() => resumoGlobal(estado), [estado]);
  const categorias = useMemo(() => categoriasOrdenadas(resumo.categorias), [resumo]);
  const mensal = useMemo(() => dadosMensais(estado), [estado]);
  const relatorio = useMemo(() => relatorioMensal(estado), [estado]);
  const listaCategorias = useMemo(() => nomesDeCategorias(estado.pedidos), [estado.pedidos]);

  const valor = {
    utilizador, estado, resumo, categorias, mensal, relatorio, listaCategorias, estaVendido,
    editarCampo, editarConfig,
    novoPedido, apagarPedido, novoItem, apagarItem, marcarVendido, bulkCategoria, aplicarTemplate,
    novaLinha, apagarLinha, uploadFotoLinha, aplicarTemplateLinha, finalizarRascunho,
    novoPatch, apagarPatch, uploadFotoPatch,
    uploadFoto, removerFoto,
    novoSocio, apagarSocio, novaDespesa, apagarDespesa, novaCredencial, apagarCredencial,
    carregarCredenciais, exportar, importar, sair, confirmar,
  };

  return (
    <EstadoContexto.Provider value={valor}>
      <TopNav utilizador={utilizador} onSair={sair} />
      <main className="container">{children}</main>

      <footer className="rodape">
        Next.js + SQLite · dados sincronizados entre dispositivos · sessão de {utilizador.nome}
      </footer>

      <datalist id="categorias">
        <option value="Camisa de futebol" />
        <option value="Polo" />
        <option value="Relógio" />
        <option value="Camisola" />
        <option value="Acessório" />
      </datalist>

      {confirmacao && (
        <ModalConfirmar
          {...confirmacao}
          onConfirmar={() => responderConfirmacao(true)}
          onFechar={() => responderConfirmacao(false)}
        />
      )}
      {erro && <div className="toast" role="alert">{erro}</div>}
    </EstadoContexto.Provider>
  );
}

// ---------- Helpers de atualização local do estado ----------
function aplicarCampoLocal(estado, tabela, id, campo, valor) {
  if (tabela === "pedidos") {
    return { ...estado, pedidos: estado.pedidos.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)) };
  }
  if (tabela === "despesas") {
    return { ...estado, despesas: estado.despesas.map((d) => (d.id === id ? { ...d, [campo]: valor } : d)) };
  }
  if (tabela === "socios") {
    return { ...estado, socios: estado.socios.map((s) => (s.id === id ? { ...s, [campo]: valor } : s)) };
  }
  if (tabela === "credenciais") {
    return { ...estado, credenciais: estado.credenciais.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)) };
  }
  if (tabela === "rascunho") {
    return { ...estado, rascunho: estado.rascunho.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)) };
  }
  if (tabela === "patches") {
    const upd = (lista) => (lista || []).map((pt) => (pt.id === id ? { ...pt, [campo]: valor } : pt));
    return {
      ...estado,
      pedidos: estado.pedidos.map((p) => ({ ...p, itens: p.itens.map((it) => ({ ...it, patches: upd(it.patches) })) })),
      rascunho: estado.rascunho.map((l) => ({ ...l, patches: upd(l.patches) })),
    };
  }
  // itens
  return {
    ...estado,
    pedidos: estado.pedidos.map((p) => ({
      ...p,
      itens: p.itens.map((it) => (it.id === id ? { ...it, [campo]: valor } : it)),
    })),
  };
}

function substituirItemCampos(estado, pedidoId, itemId, campos) {
  return {
    ...estado,
    pedidos: estado.pedidos.map((p) =>
      p.id !== pedidoId ? p : { ...p, itens: p.itens.map((it) => (it.id === itemId ? { ...it, ...campos } : it)) }
    ),
  };
}

function substituirItem(estado, item) {
  return {
    ...estado,
    pedidos: estado.pedidos.map((p) =>
      p.id !== item.pedidoId ? p : { ...p, itens: p.itens.map((it) => (it.id === item.id ? item : it)) }
    ),
  };
}

// ---------- Helpers de patches aninhados (no item ou na linha do rascunho) ----------
function aplicarNosPatches(estado, patch, fn) {
  if (patch.itemId) {
    return {
      ...estado,
      pedidos: estado.pedidos.map((p) => ({
        ...p,
        itens: p.itens.map((it) => (it.id === patch.itemId ? { ...it, patches: fn(it.patches || []) } : it)),
      })),
    };
  }
  return {
    ...estado,
    rascunho: estado.rascunho.map((l) => (l.id === patch.linhaId ? { ...l, patches: fn(l.patches || []) } : l)),
  };
}
const adicionarPatch = (estado, patch) => aplicarNosPatches(estado, patch, (lista) => [...lista, patch]);
const substituirPatch = (estado, patch) => aplicarNosPatches(estado, patch, (lista) => lista.map((p) => (p.id === patch.id ? patch : p)));
const removerPatch = (estado, patch) => aplicarNosPatches(estado, patch, (lista) => lista.filter((p) => p.id !== patch.id));

function nomesDeCategorias(pedidos) {
  const set = new Set();
  for (const p of pedidos) for (const it of p.itens) if (it.categoria?.trim()) set.add(it.categoria);
  return [...set].sort();
}
