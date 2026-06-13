"use client";

import { useIdioma } from "./Idioma";

// Barra de pesquisa + filtros por estado, sócio e categoria.
export default function Filtros({ valor, onMudar, categorias, socios = [], ocultarEstado = false }) {
  const { t } = useIdioma();
  const set = (campo) => (e) => onMudar({ ...valor, [campo]: e.target.value });
  const ativo = valor.texto || valor.estado !== "todos" || valor.categoria || valor.socio || valor.tipo;

  return (
    <div className="filtros">
      <input
        className="filtro-pesquisa"
        type="search"
        placeholder={t("filtros.pesquisar")}
        value={valor.texto}
        onChange={set("texto")}
      />
      <select value={valor.socio} onChange={set("socio")}>
        <option value="">{t("filtros.todosSocios")}</option>
        <option value="solo">{t("filtros.sozinho")}</option>
        {socios.map((s) => (
          <option key={s.id} value={s.id}>{s.nome}</option>
        ))}
      </select>
      <select value={valor.tipo} onChange={set("tipo")}>
        <option value="">{t("filtros.tipoTodos")}</option>
        <option value="normal">{t("filtros.soPedidos")}</option>
        <option value="encomenda">{t("filtros.soEncomendas")}</option>
      </select>
      {!ocultarEstado && (
        <select value={valor.estado} onChange={set("estado")}>
          <option value="todos">{t("filtros.estadoTodos")}</option>
          <option value="stock">{t("filtros.emStock")}</option>
          <option value="vendido">{t("filtros.vendidos")}</option>
        </select>
      )}
      <select value={valor.categoria} onChange={set("categoria")}>
        <option value="">{t("filtros.todasCategorias")}</option>
        {categorias.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {ativo && (
        <button className="btn mini" onClick={() => onMudar({ texto: "", estado: "todos", categoria: "", socio: "", tipo: "" })}>
          {t("filtros.limpar")}
        </button>
      )}
    </div>
  );
}
