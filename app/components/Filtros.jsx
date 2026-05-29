"use client";

// Barra de pesquisa + filtros por estado e categoria. O estado vive no
// Dashboard; aqui é só a UI que o controla.
export default function Filtros({ valor, onMudar, categorias }) {
  const set = (campo) => (e) => onMudar({ ...valor, [campo]: e.target.value });
  const ativo = valor.texto || valor.estado !== "todos" || valor.categoria;

  return (
    <div className="filtros">
      <input
        className="filtro-pesquisa"
        type="search"
        placeholder="Pesquisar item, categoria ou pedido…"
        value={valor.texto}
        onChange={set("texto")}
      />
      <select value={valor.estado} onChange={set("estado")}>
        <option value="todos">Todos</option>
        <option value="stock">Em stock</option>
        <option value="vendido">Vendidos</option>
      </select>
      <select value={valor.categoria} onChange={set("categoria")}>
        <option value="">Todas as categorias</option>
        {categorias.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {ativo && (
        <button className="btn mini" onClick={() => onMudar({ texto: "", estado: "todos", categoria: "" })}>
          Limpar
        </button>
      )}
    </div>
  );
}
