"use client";

import { useState } from "react";

// Despesas fixas/recorrentes (chip, domínio, sacos a granel...). O total sai
// do lucro real lá em cima. Edição inline, debounce tratado pelo Dashboard.
export default function Despesas({ despesas, onEditar, onCriar, onApagar }) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [periodo, setPeriodo] = useState("mensal");

  function criar(e) {
    e.preventDefault();
    if (!nome.trim() && !valor) return;
    onCriar({ nome, valor, periodo });
    setNome(""); setValor(""); setPeriodo("mensal");
  }

  return (
    <>
      <div className="despesas-lista">
        {despesas.map((d) => (
          <div className="despesa-linha" key={d.id}>
            <input
              value={d.nome}
              placeholder="ex: Chip DIGI"
              onChange={(e) => onEditar(d.id, "nome", e.target.value)}
            />
            <input
              className="num" type="number" step="0.01" placeholder="€"
              value={d.valor}
              onChange={(e) => onEditar(d.id, "valor", e.target.value)}
            />
            <select value={d.periodo} onChange={(e) => onEditar(d.id, "periodo", e.target.value)}>
              <option value="mensal">por mês</option>
              <option value="unico">uma vez</option>
            </select>
            <button className="btn fantasma" title="Apagar despesa" onClick={() => onApagar(d.id)}>✕</button>
          </div>
        ))}
        {despesas.length === 0 && (
          <p className="dim pequeno">Sem despesas fixas. Adiciona uma abaixo (ex: chip, domínio, embalagens).</p>
        )}
      </div>

      <form className="form-novo" style={{ marginTop: 12 }} onSubmit={criar}>
        <label className="campo">
          <span>Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: Domínio" />
        </label>
        <label className="campo">
          <span>Valor (€)</span>
          <input className="num" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
        </label>
        <label className="campo">
          <span>Período</span>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="mensal">por mês</option>
            <option value="unico">uma vez</option>
          </select>
        </label>
        <button className="btn" type="submit">+ Adicionar despesa</button>
      </form>
    </>
  );
}
