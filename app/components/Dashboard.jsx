"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  resumoGlobal, categoriasOrdenadas, serieLucroAcumulado, relatorioMensal, estaVendido,
} from "@/lib/calculos";
import ResumoCartoes from "./ResumoCartoes";
import RelatorioMensal from "./RelatorioMensal";
import Categorias from "./Categorias";
import GraficoLucro from "./GraficoLucro";
import Socios from "./Socios";
import Credenciais from "./Credenciais";
import Despesas from "./Despesas";
import NovoPedido from "./NovoPedido";
import Filtros from "./Filtros";
import Pedido from "./Pedido";

const FILTROS_VAZIO = { texto: "", estado: "todos", categoria: "" };

export default function Dashboard({ utilizador, estadoInicial }) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoInicial);
  const [filtros, setFiltros] = useState(FILTROS_VAZIO);

  const timers = useRef({});
  const pendentes = useRef(0);

  // ---------- Sincronização ----------
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
  }
  async function apagarPedido(id) {
    if (!confirm("Apagar este pedido e todos os seus itens?")) return;
    await persistir(`/api/pedidos/${id}`, "DELETE");
    setEstado((prev) => ({ ...prev, pedidos: prev.pedidos.filter((p) => p.id !== id) }));
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

  // ---------- Backup ----------
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
  const serie = useMemo(() => serieLucroAcumulado(estado.pedidos), [estado.pedidos]);
  const relatorio = useMemo(() => relatorioMensal(estado.pedidos), [estado.pedidos]);
  const listaCategorias = useMemo(() => nomesDeCategorias(estado.pedidos), [estado.pedidos]);

  // ---------- Filtros ----------
  const filtroAtivo = filtros.texto || filtros.estado !== "todos" || filtros.categoria;
  function corresponde(item, pedido) {
    if (filtros.estado === "vendido" && !estaVendido(item)) return false;
    if (filtros.estado === "stock" && estaVendido(item)) return false;
    if (filtros.categoria && item.categoria !== filtros.categoria) return false;
    if (filtros.texto) {
      const alvo = `${item.nome} ${item.categoria} ${item.notas} ${pedido.nome}`.toLowerCase();
      if (!alvo.includes(filtros.texto.toLowerCase())) return false;
    }
    return true;
  }
  const pedidosVisiveis = filtroAtivo
    ? estado.pedidos.filter((p) => p.itens.some((it) => corresponde(it, p)))
    : estado.pedidos;

  return (
    <div className="container">
      <header className="topo">
        <div className="topo-linha">
          <div className="marca">
            <h1>ReSell<span className="ponto">.</span></h1>
            <span className="tagline">tracker de revenda</span>
          </div>
          <div className="sessao">
            <span>olá, <strong>{utilizador.nome}</strong></span>
            <button className="btn mini" onClick={sair}>Sair</button>
          </div>
        </div>

        <ResumoCartoes resumo={resumo} />

        <div className="barra-acoes">
          <label className="campo inline">
            <span>Margem mín. %</span>
            <input type="number" className="num pequeno" min="0" max="99" step="1"
              value={estado.config.margemMinima ?? 20} onChange={(e) => editarConfig("margemMinima", e.target.value)} />
          </label>
          <label className="campo inline">
            <span>Alerta após (dias)</span>
            <input type="number" className="num pequeno" min="1" step="1"
              value={estado.config.diasAlerta ?? 30} onChange={(e) => editarConfig("diasAlerta", e.target.value)} />
          </label>
          <span className="espaco" />
          <button className="btn" onClick={() => exportar("json")}>Exportar JSON</button>
          <button className="btn" onClick={() => exportar("csv")}>Exportar CSV</button>
          <label className="btn" style={{ cursor: "pointer" }}>
            Importar
            <input type="file" accept="application/json" hidden
              onChange={(e) => { importar(e.target.files[0]); e.target.value = ""; }} />
          </label>
        </div>
      </header>

      <section className="bloco">
        <h2>Este mês</h2>
        <RelatorioMensal relatorio={relatorio} />
      </section>

      <section className="bloco">
        <h2>Lucro acumulado</h2>
        <GraficoLucro serie={serie} />
      </section>

      <section className="bloco">
        <h2>Sócios <span className="conta">— lucro a meias por pedido</span></h2>
        <Socios
          socios={estado.socios} porSocio={resumo.porSocio} meuLucro={resumo.meuLucro}
          onCriar={novoSocio}
          onEditar={(id, campo, valor) => editarCampo("socios", id, campo, valor)}
          onApagar={apagarSocio}
        />
      </section>

      <section className="bloco">
        <h2>Lucro por categoria</h2>
        <Categorias categorias={categorias} />
      </section>

      <section className="bloco">
        <h2>Contas e passwords <span className="conta">— cifradas no servidor</span></h2>
        <Credenciais
          credenciais={estado.credenciais} socios={estado.socios}
          onCriar={novaCredencial}
          onEditar={(id, campo, valor) => editarCampo("credenciais", id, campo, valor)}
          onApagar={apagarCredencial}
        />
      </section>

      <section className="bloco">
        <h2>Despesas fixas <span className="conta">— saem do lucro real ({resumo.mesesAtivos} mes(es) ativos)</span></h2>
        <Despesas
          despesas={estado.despesas}
          onEditar={(id, campo, valor) => editarCampo("despesas", id, campo, valor)}
          onCriar={novaDespesa} onApagar={apagarDespesa}
        />
      </section>

      <section className="bloco">
        <h2>Novo pedido</h2>
        <NovoPedido socios={estado.socios} onCriar={novoPedido} />
      </section>

      <section className="bloco">
        <h2>Pedidos <span className="conta">— {pedidosVisiveis.length}{filtroAtivo ? ` de ${estado.pedidos.length}` : ""}</span></h2>
        <Filtros valor={filtros} onMudar={setFiltros} categorias={listaCategorias} />
        {estado.pedidos.length === 0 ? (
          <div className="vazio">Ainda não há pedidos. Cria o primeiro acima.</div>
        ) : pedidosVisiveis.length === 0 ? (
          <div className="vazio">Nenhum item corresponde aos filtros.</div>
        ) : (
          pedidosVisiveis.map((pedido, i) => (
            <Pedido
              key={pedido.id} pedido={pedido} indice={i} config={estado.config} socios={estado.socios}
              corresponde={filtroAtivo ? (it) => corresponde(it, pedido) : undefined}
              onEditarPedido={(campo, valor) => editarCampo("pedidos", pedido.id, campo, valor)}
              onEditarItem={(itemId, campo, valor) => editarCampo("itens", itemId, campo, valor)}
              onMarcarVendido={(itemId, preco, data) => marcarVendido(pedido.id, itemId, preco, data)}
              onNovoItem={() => novoItem(pedido.id)}
              onApagarItem={(itemId) => apagarItem(pedido.id, itemId)}
              onApagarPedido={() => apagarPedido(pedido.id)}
              onUploadFoto={uploadFoto} onRemoverFoto={removerFoto} onBulkCategoria={bulkCategoria}
            />
          ))
        )}
      </section>

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
    </div>
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

// substitui um item inteiro (vindo do servidor) pelo seu id
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
