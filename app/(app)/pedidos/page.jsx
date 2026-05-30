"use client";

import { useState } from "react";
import { useEstado } from "@/app/components/contexto";
import { estaVendido } from "@/lib/calculos";
import NovoPedido from "@/app/components/NovoPedido";
import Filtros from "@/app/components/Filtros";
import PedidoLinha from "@/app/components/PedidoLinha";

const FILTROS_VAZIO = { texto: "", estado: "todos", categoria: "" };

// Página de pedidos: criar + filtrar + lista compacta (clica para o detalhe).
export default function PaginaPedidos() {
  const { estado, listaCategorias, novoPedido } = useEstado();
  const [filtros, setFiltros] = useState(FILTROS_VAZIO);

  const filtroAtivo = filtros.texto || filtros.estado !== "todos" || filtros.categoria;
  function correspondePedido(p) {
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
        <h2>Novo pedido</h2>
        <NovoPedido socios={estado.socios} onCriar={novoPedido} />
      </section>

      <section className="bloco">
        <h2>Pedidos <span className="conta">— {visiveis.length}{filtroAtivo ? ` de ${estado.pedidos.length}` : ""}</span></h2>
        <Filtros valor={filtros} onMudar={setFiltros} categorias={listaCategorias} />
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
