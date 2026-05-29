"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resumoGlobal, categoriasOrdenadas, serieLucroAcumulado } from "@/lib/calculos";
import ResumoCartoes from "./ResumoCartoes";
import Categorias from "./Categorias";
import GraficoLucro from "./GraficoLucro";
import Despesas from "./Despesas";
import NovoPedido from "./NovoPedido";
import Pedido from "./Pedido";

/* O Dashboard é o dono do estado. Recebe o estado inicial já renderizado no
   servidor e, a partir daí, trata de todas as mutações:
   - edições de campo são otimistas (mexem já no estado local) e persistidas
     com debounce, para não perder o foco enquanto se escreve;
   - operações estruturais (criar/apagar/marcar vendido) persistem e atualizam
     o estado com a resposta;
   - de vez em quando recarrega tudo, para apanhar alterações do sócio. */
export default function Dashboard({ utilizador, estadoInicial }) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoInicial);

  const timers = useRef({}); // debounce por campo
  const pendentes = useRef(0); // nº de escritas por confirmar

  // ---------- Sincronização: recarrega o estado de tempos a tempos ----------
  async function recarregar() {
    const r = await fetch("/api/estado");
    if (r.ok) setEstado(await r.json());
  }

  useEffect(() => {
    const intervalo = setInterval(() => {
      const aEscrever = pendentes.current > 0;
      const aEditar = document.activeElement?.closest?.("input, select");
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

  // Edição otimista + debounce. `tabela` é "pedidos", "itens" ou "despesas".
  function editarCampo(tabela, id, campo, valor) {
    setEstado((prev) => aplicarCampoLocal(prev, tabela, id, campo, valor));

    const chave = `${tabela}:${id}:${campo}`;
    clearTimeout(timers.current[chave]);
    pendentes.current++;
    timers.current[chave] = setTimeout(async () => {
      try {
        await persistir(`/api/${tabela}/${id}`, "PATCH", { [campo]: valor });
      } finally {
        pendentes.current--;
      }
    }, 450);
  }

  function editarConfig(campo, valor) {
    setEstado((prev) => ({ ...prev, config: { ...prev.config, [campo]: valor } }));
    const chave = `config:${campo}`;
    clearTimeout(timers.current[chave]);
    pendentes.current++;
    timers.current[chave] = setTimeout(async () => {
      try {
        await persistir("/api/config", "PATCH", { [campo]: valor });
      } finally {
        pendentes.current--;
      }
    }, 450);
  }

  // ---------- Operações estruturais ----------
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
      pedidos: prev.pedidos.map((p) =>
        p.id === pedidoId ? { ...p, itens: [...p.itens, item] } : p
      ),
    }));
  }

  async function apagarItem(pedidoId, itemId) {
    await persistir(`/api/itens/${itemId}`, "DELETE");
    setEstado((prev) => ({
      ...prev,
      pedidos: prev.pedidos.map((p) =>
        p.id === pedidoId ? { ...p, itens: p.itens.filter((i) => i.id !== itemId) } : p
      ),
    }));
  }

  // marca um item como vendido de uma vez (preço + data), vindo do modal
  async function marcarVendido(pedidoId, itemId, precoVenda, dataVenda) {
    setEstado((prev) => aplicarItensLocal(prev, pedidoId, itemId, { precoVenda, dataVenda }));
    await persistir(`/api/itens/${itemId}`, "PATCH", { precoVenda, dataVenda });
  }

  async function novaDespesa(dados) {
    const r = await persistir("/api/despesas", "POST", dados);
    const despesa = await r.json();
    setEstado((prev) => ({ ...prev, despesas: [...prev.despesas, despesa] }));
  }

  async function apagarDespesa(id) {
    await persistir(`/api/despesas/${id}`, "DELETE");
    setEstado((prev) => ({ ...prev, despesas: prev.despesas.filter((d) => d.id !== id) }));
  }

  // ---------- Backup ----------
  function exportar(formato) {
    window.location.href = `/api/exportar?formato=${formato}`;
  }

  async function importar(ficheiro) {
    if (!ficheiro) return;
    if (!confirm("Importar substitui todos os dados atuais. Continuar?")) return;
    try {
      const texto = await ficheiro.text();
      const r = await persistir("/api/importar", "POST", JSON.parse(texto));
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
            <span>Sócios</span>
            <input
              type="number" className="num pequeno" min="1" step="1"
              value={estado.config.socios ?? 2}
              onChange={(e) => editarConfig("socios", e.target.value)}
            />
          </label>
          <label className="campo inline">
            <span>Margem mín. %</span>
            <input
              type="number" className="num pequeno" min="0" max="99" step="1"
              value={estado.config.margemMinima ?? 20}
              onChange={(e) => editarConfig("margemMinima", e.target.value)}
            />
          </label>
          <label className="campo inline">
            <span>Alerta após (dias)</span>
            <input
              type="number" className="num pequeno" min="1" step="1"
              value={estado.config.diasAlerta ?? 30}
              onChange={(e) => editarConfig("diasAlerta", e.target.value)}
            />
          </label>
          <span className="espaco" />
          <button className="btn" onClick={() => exportar("json")}>Exportar JSON</button>
          <button className="btn" onClick={() => exportar("csv")}>Exportar CSV</button>
          <label className="btn" style={{ cursor: "pointer" }}>
            Importar
            <input
              type="file" accept="application/json" hidden
              onChange={(e) => { importar(e.target.files[0]); e.target.value = ""; }}
            />
          </label>
        </div>
      </header>

      <section className="bloco">
        <h2>Lucro acumulado</h2>
        <GraficoLucro serie={serie} />
      </section>

      <section className="bloco">
        <h2>Lucro por categoria</h2>
        <Categorias categorias={categorias} />
      </section>

      <section className="bloco">
        <h2>Despesas fixas <span className="conta">— saem do lucro real</span></h2>
        <Despesas
          despesas={estado.despesas}
          onEditar={(id, campo, valor) => editarCampo("despesas", id, campo, valor)}
          onCriar={novaDespesa}
          onApagar={apagarDespesa}
        />
      </section>

      <section className="bloco">
        <h2>Novo pedido</h2>
        <NovoPedido onCriar={novoPedido} />
      </section>

      <section className="bloco">
        <h2>Pedidos <span className="conta">— {estado.pedidos.length}</span></h2>
        {estado.pedidos.length === 0 ? (
          <div className="vazio">Ainda não há pedidos. Cria o primeiro acima.</div>
        ) : (
          estado.pedidos.map((pedido, i) => (
            <Pedido
              key={pedido.id}
              pedido={pedido}
              indice={i}
              config={estado.config}
              onEditarPedido={(campo, valor) => editarCampo("pedidos", pedido.id, campo, valor)}
              onEditarItem={(itemId, campo, valor) => editarCampo("itens", itemId, campo, valor)}
              onMarcarVendido={(itemId, preco, data) => marcarVendido(pedido.id, itemId, preco, data)}
              onNovoItem={() => novoItem(pedido.id)}
              onApagarItem={(itemId) => apagarItem(pedido.id, itemId)}
              onApagarPedido={() => apagarPedido(pedido.id)}
            />
          ))
        )}
      </section>

      <footer className="rodape">
        Next.js + SQLite · dados sincronizados entre dispositivos · sessão de {utilizador.nome}
      </footer>

      {/* sugestões de categoria (livre — podes escrever qualquer uma) */}
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
    return {
      ...estado,
      pedidos: estado.pedidos.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)),
    };
  }
  if (tabela === "despesas") {
    return {
      ...estado,
      despesas: estado.despesas.map((d) => (d.id === id ? { ...d, [campo]: valor } : d)),
    };
  }
  // itens: o id é único, mas temos de encontrar o pedido a que pertence
  return {
    ...estado,
    pedidos: estado.pedidos.map((p) => ({
      ...p,
      itens: p.itens.map((it) => (it.id === id ? { ...it, [campo]: valor } : it)),
    })),
  };
}

function aplicarItensLocal(estado, pedidoId, itemId, campos) {
  return {
    ...estado,
    pedidos: estado.pedidos.map((p) =>
      p.id !== pedidoId
        ? p
        : { ...p, itens: p.itens.map((it) => (it.id === itemId ? { ...it, ...campos } : it)) }
    ),
  };
}
