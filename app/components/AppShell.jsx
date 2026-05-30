"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resumoGlobal, categoriasOrdenadas, dadosMensais, relatorioMensal, estaVendido } from "@/lib/calculos";
import { EstadoContexto } from "./contexto";
import TopNav from "./TopNav";

/* O AppShell é o dono do estado do negócio. Vive no layout do grupo (app), por
   isso sobrevive à navegação entre páginas — o estado e o polling mantêm-se.
   Toda a lógica que antes estava no Dashboard está aqui, exposta por contexto. */
export default function AppShell({ utilizador, estadoInicial, children }) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoInicial);

  const timers = useRef({}); // debounce por campo
  const pendentes = useRef(0); // nº de escritas por confirmar

  // ---------- Sincronização (apanha alterações do sócio) ----------
  async function recarregar() {
    const r = await fetch("/api/estado");
    if (r.ok) setEstado(await r.json());
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
      try { await persistir(`/api/${tabela}/${id}`, "PATCH", { [campo]: valor }); }
      finally { pendentes.current--; }
    }, 450);
  }

  function editarConfig(campo, valor) {
    setEstado((prev) => ({ ...prev, config: { ...prev.config, [campo]: valor } }));
    const chave = `config:${campo}`;
    clearTimeout(timers.current[chave]);
    pendentes.current++;
    timers.current[chave] = setTimeout(async () => {
      try { await persistir("/api/config", "PATCH", { [campo]: valor }); }
      finally { pendentes.current--; }
    }, 450);
  }

  // ---------- Pedidos / itens ----------
  async function novoPedido(dados) {
    const r = await persistir("/api/pedidos", "POST", dados);
    const pedido = await r.json();
    setEstado((prev) => ({ ...prev, pedidos: [pedido, ...prev.pedidos] }));
    return pedido;
  }
  async function apagarPedido(id) {
    if (!confirm("Apagar este pedido e todos os seus itens?")) return false;
    await persistir(`/api/pedidos/${id}`, "DELETE");
    setEstado((prev) => ({ ...prev, pedidos: prev.pedidos.filter((p) => p.id !== id) }));
    return true;
  }
  async function novoItem(pedidoId) {
    const r = await persistir("/api/itens", "POST", { pedidoId });
    const item = await r.json();
    setEstado((prev) => ({
      ...prev,
      pedidos: prev.pedidos.map((p) => (p.id === pedidoId ? { ...p, itens: [...p.itens, item] } : p)),
    }));
  }
  async function apagarItem(pedidoId, itemId) {
    await persistir(`/api/itens/${itemId}`, "DELETE");
    setEstado((prev) => ({
      ...prev,
      pedidos: prev.pedidos.map((p) => (p.id === pedidoId ? { ...p, itens: p.itens.filter((i) => i.id !== itemId) } : p)),
    }));
  }
  async function marcarVendido(pedidoId, itemId, precoVenda, dataVenda) {
    setEstado((prev) => substituirItemCampos(prev, pedidoId, itemId, { precoVenda, dataVenda }));
    await persistir(`/api/itens/${itemId}`, "PATCH", { precoVenda, dataVenda });
  }
  async function bulkCategoria(ids, categoria) {
    if (ids.length === 0) return;
    await persistir("/api/itens/categoria", "POST", { ids, categoria });
    setEstado((prev) => ({
      ...prev,
      pedidos: prev.pedidos.map((p) => ({
        ...p,
        itens: p.itens.map((it) => (ids.includes(it.id) ? { ...it, categoria } : it)),
      })),
    }));
  }

  // ---------- Fotos ----------
  async function uploadFoto(itemId, ficheiro) {
    const fd = new FormData();
    fd.append("foto", ficheiro);
    const r = await fetch(`/api/itens/${itemId}/foto`, { method: "POST", body: fd });
    if (!r.ok) return;
    const item = await r.json();
    setEstado((prev) => substituirItem(prev, item));
  }
  async function removerFoto(itemId) {
    const r = await persistir(`/api/itens/${itemId}/foto`, "DELETE");
    if (!r.ok) return;
    const item = await r.json();
    setEstado((prev) => substituirItem(prev, item));
  }

  // ---------- Sócios ----------
  async function novoSocio(dados) {
    const r = await persistir("/api/socios", "POST", dados);
    const socio = await r.json();
    setEstado((prev) => ({ ...prev, socios: [...prev.socios, socio] }));
  }
  async function apagarSocio(id) {
    if (!confirm("Apagar este sócio? Os pedidos dele passam a 'sozinho'.")) return;
    await persistir(`/api/socios/${id}`, "DELETE");
    setEstado((prev) => ({
      ...prev,
      socios: prev.socios.filter((s) => s.id !== id),
      pedidos: prev.pedidos.map((p) => (p.socioId === id ? { ...p, socioId: null } : p)),
      credenciais: prev.credenciais.map((c) => (c.socioId === id ? { ...c, socioId: null } : c)),
    }));
  }

  // ---------- Despesas ----------
  async function novaDespesa(dados) {
    const r = await persistir("/api/despesas", "POST", dados);
    const despesa = await r.json();
    setEstado((prev) => ({ ...prev, despesas: [...prev.despesas, despesa] }));
  }
  async function apagarDespesa(id) {
    await persistir(`/api/despesas/${id}`, "DELETE");
    setEstado((prev) => ({ ...prev, despesas: prev.despesas.filter((d) => d.id !== id) }));
  }

  // ---------- Credenciais ----------
  async function novaCredencial(dados) {
    const r = await persistir("/api/credenciais", "POST", dados);
    const credencial = await r.json();
    setEstado((prev) => ({ ...prev, credenciais: [...prev.credenciais, credencial] }));
  }
  async function apagarCredencial(id) {
    await persistir(`/api/credenciais/${id}`, "DELETE");
    setEstado((prev) => ({ ...prev, credenciais: prev.credenciais.filter((c) => c.id !== id) }));
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
    novoPedido, apagarPedido, novoItem, apagarItem, marcarVendido, bulkCategoria,
    uploadFoto, removerFoto,
    novoSocio, apagarSocio, novaDespesa, apagarDespesa, novaCredencial, apagarCredencial,
    exportar, importar, sair,
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

function nomesDeCategorias(pedidos) {
  const set = new Set();
  for (const p of pedidos) for (const it of p.itens) if (it.categoria?.trim()) set.add(it.categoria);
  return [...set].sort();
}
