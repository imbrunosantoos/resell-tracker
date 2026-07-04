"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { estaVendido, diasEmStock, toNumber } from "@/lib/calculos";
import NovoPedido from "@/app/components/NovoPedido";
import NovaEncomenda from "@/app/components/NovaEncomenda";
import ModalCriar from "@/app/components/ModalCriar";
import Filtros from "@/app/components/Filtros";
import PedidoLinha from "@/app/components/PedidoLinha";
import ListaStock from "@/app/components/ListaStock";
import TabelaInventario from "@/app/components/TabelaInventario";

const FILTROS_VAZIO = { texto: "", estado: "todos", categoria: "", socio: "", tipo: "" };
const CHAVE_FILTROS = "pedidos:filtros"; // guarda o filtro entre navegações (sessão)

function lerFiltrosGuardados() {
  if (typeof window === "undefined") return FILTROS_VAZIO;
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CHAVE_FILTROS) || "null");
    return guardado && typeof guardado === "object" ? { ...FILTROS_VAZIO, ...guardado } : FILTROS_VAZIO;
  } catch { return FILTROS_VAZIO; }
}

// Página de pedidos — lista primeiro: segmentado de vista + botões de criação
// no topo; a criação abre num modal. Painel único com filtros + lista.
export default function PaginaPedidos() {
  const { estado, listaCategorias, novoPedido, novaEncomenda } = useEstado();
  const { t } = useIdioma();
  const router = useRouter();
  const [filtros, setFiltros] = useState(FILTROS_VAZIO);
  const [criar, setCriar] = useState(null); // null | "pedido" | "encomenda"
  // Vista por defeito: "pedidos". O atalho da página inicial aponta para
  // /pedidos?vista=stock para abrir já na lista de itens em stock.
  const [vista, setVista] = useState("pedidos"); // "pedidos" | "stock" | "inventario"
  const diasAlerta = toNumber(estado.config.diasAlerta) || 30;

  // Cria o pedido e entra logo no detalhe para adicionar os itens.
  async function criarEEntrar(dados) {
    const pedido = await novoPedido(dados);
    if (pedido) { setCriar(null); router.push(`/pedidos/${pedido.id}`); }
  }
  async function criarEncomenda(dados) {
    const pedido = await novaEncomenda(dados);
    if (pedido) setCriar(null);
    return pedido;
  }

  // Recupera o filtro guardado ao voltar à página (ex.: depois de abrir um pedido).
  useEffect(() => { setFiltros(lerFiltrosGuardados()); }, []);
  // ?vista=stock (vindo do atalho da página inicial) → abre na lista de stock.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("vista") === "stock") setVista("stock");
  }, []);
  // Guarda sempre que muda; "Limpar" grava o estado vazio (volta ao normal).
  const aplicarFiltros = (novos) => {
    setFiltros(novos);
    try { sessionStorage.setItem(CHAVE_FILTROS, JSON.stringify(novos)); } catch { /* ignora */ }
  };
  const clientesEncomenda = [...new Set(
    estado.pedidos.filter((p) => p.tipo === "encomenda" && p.cliente?.trim()).map((p) => p.cliente.trim())
  )].sort();

  const filtroAtivo = filtros.texto || filtros.estado !== "todos" || filtros.categoria || filtros.socio || filtros.tipo;
  const filtroItemAtivo = filtros.texto || filtros.estado !== "todos" || filtros.categoria;

  function correspondePedido(p) {
    // filtro de tipo (pedido normal vs encomenda) é ao nível do pedido
    if (filtros.tipo) {
      const tipo = p.tipo || "normal";
      if (filtros.tipo === "encomenda" ? tipo !== "encomenda" : tipo === "encomenda") return false;
    }
    // filtro de sócio é ao nível do pedido
    if (filtros.socio) {
      const ok = filtros.socio === "solo" ? !p.socioId : p.socioId === filtros.socio;
      if (!ok) return false;
    }
    // sem filtros de item, o pedido passa; senão tem de ter um item que corresponda
    if (!filtroItemAtivo) return true;
    return p.itens.some((it) => {
      if (filtros.estado === "vendido" && !estaVendido(it)) return false;
      if (filtros.estado === "stock" && estaVendido(it)) return false;
      if (filtros.categoria && it.categoria !== filtros.categoria) return false;
      if (filtros.texto) {
        const alvo = `${it.nome} ${it.categoria} ${it.notas} ${p.nome}`.toLowerCase();
        if (!alvo.includes(filtros.texto.toLowerCase())) return false;
      }
      return true;
    });
  }
  const visiveis = filtroAtivo ? estado.pedidos.filter(correspondePedido) : estado.pedidos;

  // Itens em stock atual: não vendidos, de pedidos já chegados (com data de
  // chegada). Respeita os filtros de pesquisa/categoria/sócio/tipo. Mais
  // parados primeiro.
  const itensStock = [];
  for (const p of estado.pedidos) {
    if (!p.dataChegada) continue;
    if (filtros.tipo) {
      const tipo = p.tipo || "normal";
      if (filtros.tipo === "encomenda" ? tipo !== "encomenda" : tipo === "encomenda") continue;
    }
    if (filtros.socio) {
      const ok = filtros.socio === "solo" ? !p.socioId : p.socioId === filtros.socio;
      if (!ok) continue;
    }
    for (const it of p.itens) {
      if (estaVendido(it)) continue;
      if (filtros.categoria && it.categoria !== filtros.categoria) continue;
      if (filtros.texto) {
        const alvo = `${it.nome} ${it.categoria} ${it.notas} ${p.nome}`.toLowerCase();
        if (!alvo.includes(filtros.texto.toLowerCase())) continue;
      }
      itensStock.push({ pedido: p, item: it, dias: diasEmStock(p, it) });
    }
  }
  itensStock.sort((a, b) => (b.dias ?? 0) - (a.dias ?? 0));

  const ehStock = vista === "stock";
  const ehInventario = vista === "inventario";

  const VISTAS = [
    { id: "pedidos", label: t("nav.pedidos") },
    { id: "stock", label: t("pedidos.emStock") },
    { id: "inventario", label: t("inv.titulo") },
  ];

  return (
    <div className="pagina">
      <div className="pagina-topo">
        <div className="seg">
          {VISTAS.map((v) => (
            <button key={v.id}
              className={"seg-btn" + (vista === v.id ? " ativo" : "")}
              onClick={() => setVista(v.id)}
            >{v.label}</button>
          ))}
        </div>
        <div className="pagina-topo-acoes">
          <button className="btn" onClick={() => setCriar("encomenda")}>+ {t("pedidos.novaEncomenda")}</button>
          <button className="btn primario" onClick={() => setCriar("pedido")}>+ {t("pedidos.novoToggle")}</button>
        </div>
      </div>

      <section className="painel">
        <div className="painel-cab">
          <span className="painel-titulo">
            {ehInventario ? t("inv.titulo") : ehStock ? t("pedidos.emStock") : t("nav.pedidos")}
          </span>
          {!ehInventario && (
            <span className="painel-sub">
              {ehStock ? itensStock.length : `${visiveis.length}${filtroAtivo ? ` ${t("pedidos.de")} ${estado.pedidos.length}` : ""}`}
            </span>
          )}
        </div>

        {!ehInventario && (
          <Filtros valor={filtros} onMudar={aplicarFiltros} categorias={listaCategorias} socios={estado.socios} ocultarEstado={ehStock} />
        )}

        {ehInventario ? (
          <TabelaInventario estado={estado} />
        ) : ehStock ? (
          <ListaStock itens={itensStock} diasAlerta={diasAlerta} />
        ) : estado.pedidos.length === 0 ? (
          <div className="vazio">{t("pedidos.vazio")}</div>
        ) : visiveis.length === 0 ? (
          <div className="vazio">{t("pedidos.semFiltro")}</div>
        ) : (
          <div className="pedidos-lista">
            {visiveis.map((p) => <PedidoLinha key={p.id} pedido={p} socios={estado.socios} />)}
          </div>
        )}
      </section>

      {criar === "pedido" && (
        <ModalCriar titulo={t("pedidos.novoToggle")} onFechar={() => setCriar(null)}>
          <NovoPedido socios={estado.socios} onCriar={criarEEntrar} />
        </ModalCriar>
      )}
      {criar === "encomenda" && (
        <ModalCriar titulo={t("pedidos.novaEncomenda")} onFechar={() => setCriar(null)}>
          <NovaEncomenda socios={estado.socios} clientes={clientesEncomenda} onCriar={criarEncomenda} />
        </ModalCriar>
      )}
    </div>
  );
}
