"use client";

import { useEffect, useState } from "react";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { estaVendido } from "@/lib/calculos";
import NovoPedido from "@/app/components/NovoPedido";
import NovaEncomenda from "@/app/components/NovaEncomenda";
import Filtros from "@/app/components/Filtros";
import PedidoLinha from "@/app/components/PedidoLinha";

const FILTROS_VAZIO = { texto: "", estado: "todos", categoria: "", socio: "", tipo: "" };
const CHAVE_FILTROS = "pedidos:filtros"; // guarda o filtro entre navegações (sessão)

function lerFiltrosGuardados() {
  if (typeof window === "undefined") return FILTROS_VAZIO;
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CHAVE_FILTROS) || "null");
    return guardado && typeof guardado === "object" ? { ...FILTROS_VAZIO, ...guardado } : FILTROS_VAZIO;
  } catch { return FILTROS_VAZIO; }
}

// Página de pedidos: criar + filtrar + lista compacta (clica para o detalhe).
export default function PaginaPedidos() {
  const { estado, listaCategorias, novoPedido, novaEncomenda } = useEstado();
  const { t } = useIdioma();
  const [filtros, setFiltros] = useState(FILTROS_VAZIO);
  const [aCriar, setACriar] = useState("pedido"); // "pedido" | "encomenda"

  // Recupera o filtro guardado ao voltar à página (ex.: depois de abrir um pedido).
  useEffect(() => { setFiltros(lerFiltrosGuardados()); }, []);
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

  return (
    <div className="pagina">
      <section className="bloco">
        <div className="criar-toggle">
          <button
            className={"toggle-btn" + (aCriar === "pedido" ? " ativo" : "")}
            onClick={() => setACriar("pedido")}
          >{t("pedidos.novoToggle")}</button>
          <button
            className={"toggle-btn" + (aCriar === "encomenda" ? " ativo" : "")}
            onClick={() => setACriar("encomenda")}
          >{t("pedidos.novaEncomenda")}</button>
        </div>
        {aCriar === "pedido" ? (
          <NovoPedido socios={estado.socios} onCriar={novoPedido} />
        ) : (
          <NovaEncomenda socios={estado.socios} clientes={clientesEncomenda} onCriar={novaEncomenda} />
        )}
      </section>

      <section className="bloco">
        <h2>{t("nav.pedidos")} <span className="conta">— {visiveis.length}{filtroAtivo ? ` ${t("pedidos.de")} ${estado.pedidos.length}` : ""}</span></h2>
        <Filtros valor={filtros} onMudar={aplicarFiltros} categorias={listaCategorias} socios={estado.socios} />
        {estado.pedidos.length === 0 ? (
          <div className="vazio">{t("pedidos.vazio")}</div>
        ) : visiveis.length === 0 ? (
          <div className="vazio">{t("pedidos.semFiltro")}</div>
        ) : (
          <div className="pedidos-lista">
            {visiveis.map((p) => <PedidoLinha key={p.id} pedido={p} socios={estado.socios} />)}
          </div>
        )}
      </section>
    </div>
  );
}
