"use client";

import { useState } from "react";
import { useEstado } from "@/app/components/contexto";
import { estaVendido } from "@/lib/calculos";
import NovoPedido from "@/app/components/NovoPedido";
import NovaEncomenda from "@/app/components/NovaEncomenda";
import Filtros from "@/app/components/Filtros";
import PedidoLinha from "@/app/components/PedidoLinha";

const FILTROS_VAZIO = { texto: "", estado: "todos", categoria: "", socio: "", tipo: "" };

// Página de pedidos: criar + filtrar + lista compacta (clica para o detalhe).
export default function PaginaPedidos() {
  const { estado, listaCategorias, novoPedido, novaEncomenda } = useEstado();
  const [filtros, setFiltros] = useState(FILTROS_VAZIO);
  const [aCriar, setACriar] = useState("pedido"); // "pedido" | "encomenda"
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
          >Novo pedido</button>
          <button
            className={"toggle-btn" + (aCriar === "encomenda" ? " ativo" : "")}
            onClick={() => setACriar("encomenda")}
          >Nova encomenda</button>
        </div>
        {aCriar === "pedido" ? (
          <NovoPedido socios={estado.socios} onCriar={novoPedido} />
        ) : (
          <NovaEncomenda socios={estado.socios} clientes={clientesEncomenda} onCriar={novaEncomenda} />
        )}
      </section>

      <section className="bloco">
        <h2>Pedidos <span className="conta">— {visiveis.length}{filtroAtivo ? ` de ${estado.pedidos.length}` : ""}</span></h2>
        <Filtros valor={filtros} onMudar={setFiltros} categorias={listaCategorias} socios={estado.socios} />
        {estado.pedidos.length === 0 ? (
          <div className="vazio">Ainda não há pedidos. Cria o primeiro acima.</div>
        ) : visiveis.length === 0 ? (
          <div className="vazio">Nenhum pedido corresponde aos filtros.</div>
        ) : (
          <div className="pedidos-lista">
            {visiveis.map((p) => <PedidoLinha key={p.id} pedido={p} socios={estado.socios} />)}
          </div>
        )}
      </section>
    </div>
  );
}
