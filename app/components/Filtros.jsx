"use client";

// Barra de pesquisa + filtros por estado, sócio e categoria.
export default function Filtros({ valor, onMudar, categorias, socios = [] }) {
  const set = (campo) => (e) => onMudar({ ...valor, [campo]: e.target.value });
  const ativo = valor.texto || valor.estado !== "todos" || valor.categoria || valor.socio;

  return (
    <div className="filtros">
      <input
        className="filtro-pesquisa"
        type="search"
        placeholder="Pesquisar item, categoria ou pedido…"
        value={valor.texto}
        onChange={set("texto")}
      />
      <select value={valor.socio} onChange={set("socio")}>
        <option value="">Todos os sócios</option>
        <option value="solo">Sozinho</option>
        {socios.map((s) => (
          <option key={s.id} value={s.id}>{s.nome}</option>
        ))}
      </select>
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
        <button className="btn mini" onClick={() => onMudar({ texto: "", estado: "todos", categoria: "", socio: "" })}>
          Limpar
        </button>
      )}
    </div>
  );
}
