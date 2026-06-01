"use client";

import { useState } from "react";

// Despesas recorrentes ou únicas (chip, domínio, sacos a granel...). Podes marcar se
// foi só tua ou dividida com um sócio (aí só metade sai do teu lucro). O total a
// nível de negócio sai do "lucro real" lá em cima. Edição inline com debounce.
export default function Despesas({ despesas, socios, onEditar, onCriar, onApagar }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [periodo, setPeriodo] = useState("mensal");
  const [socioId, setSocioId] = useState("");
  const [data, setData] = useState(hoje);

  function criar(e) {
    e.preventDefault();
    if (!nome.trim() && !valor) return;
    onCriar({ nome, valor, periodo, socioId, data });
    setNome(""); setValor(""); setPeriodo("mensal"); setSocioId(""); setData(hoje);
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
            <input
              type="date" className="desp-data" title="Data da despesa"
              value={d.data || ""} onChange={(e) => onEditar(d.id, "data", e.target.value)}
            />
            <select value={d.periodo} onChange={(e) => onEditar(d.id, "periodo", e.target.value)}>
              <option value="mensal">por mês</option>
              <option value="unico">uma vez</option>
            </select>
            <select
              value={d.socioId ?? ""}
              title="Com quem dividiste esta despesa"
              onChange={(e) => onEditar(d.id, "socioId", e.target.value)}
            >
              <option value="">Sozinho</option>
              {socios.map((s) => (
                <option key={s.id} value={s.id}>½ {s.nome}</option>
              ))}
            </select>
            <button className="btn fantasma" title="Apagar despesa" onClick={() => onApagar(d.id)}>✕</button>
          </div>
        ))}
        {despesas.length === 0 && (
          <p className="dim pequeno">Sem despesas. Adiciona uma abaixo (ex: chip, domínio, embalagens).</p>
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
        <label className="campo">
          <span>Data</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="campo">
          <span>Com quem</span>
          <select value={socioId} onChange={(e) => setSocioId(e.target.value)}>
            <option value="">Sozinho</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>½ com {s.nome}</option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit">+ Adicionar despesa</button>
      </form>
    </>
  );
}
