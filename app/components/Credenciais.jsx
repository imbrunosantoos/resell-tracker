"use client";

import { useState } from "react";

// Cofre de contas: login/password por plataforma, agrupável por sócio.
// As passwords vêm já decifradas do servidor; aqui ficam escondidas até
// carregares em "ver". Tabela estilo folha de cálculo, editável em linha.
const NOVA = { plataforma: "", utilizador: "", password: "", socioId: "", notas: "" };

export default function Credenciais({ credenciais, socios, onCriar, onEditar, onApagar }) {
  const [filtro, setFiltro] = useState("todos"); // "todos" | "sem" | socioId
  const [reveladas, setReveladas] = useState(() => new Set());
  const [nova, setNova] = useState(NOVA);

  const nomeSocio = (id) => socios.find((s) => s.id === id)?.nome ?? "—";

  const visiveis = credenciais.filter((c) => {
    if (filtro === "todos") return true;
    if (filtro === "sem") return !c.socioId;
    return c.socioId === filtro;
  });

  function alternarVer(id) {
    setReveladas((r) => {
      const novo = new Set(r);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });
  }

  function criar(e) {
    e.preventDefault();
    if (!nova.plataforma.trim() && !nova.utilizador.trim()) return;
    onCriar(nova);
    setNova(NOVA);
  }

  const setNovaCampo = (campo) => (e) => setNova((n) => ({ ...n, [campo]: e.target.value }));

  return (
    <div className="cofre">
      <div className="cofre-topo">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="todos">Todas as contas</option>
          <option value="sem">Sem sócio (minhas)</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <span className="dim pequeno">{visiveis.length} conta(s)</span>
      </div>

      <div className="tabela-scroll">
        <table className="cofre-tabela">
          <thead>
            <tr>
              <th>Plataforma</th>
              <th>Utilizador</th>
              <th>Password</th>
              <th>Sócio</th>
              <th>Notas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((c) => (
              <tr key={c.id}>
                <td><input value={c.plataforma} placeholder="ex: Vinted" onChange={(e) => onEditar(c.id, "plataforma", e.target.value)} /></td>
                <td><input value={c.utilizador} placeholder="email / user" onChange={(e) => onEditar(c.id, "utilizador", e.target.value)} /></td>
                <td>
                  <div className="cofre-pass">
                    <input
                      type={reveladas.has(c.id) ? "text" : "password"}
                      value={c.password}
                      placeholder="••••••"
                      onChange={(e) => onEditar(c.id, "password", e.target.value)}
                    />
                    <button className="btn fantasma mini" type="button" title="Ver/esconder" onClick={() => alternarVer(c.id)}>
                      {reveladas.has(c.id) ? "🙈" : "👁"}
                    </button>
                    <button
                      className="btn fantasma mini" type="button" title="Copiar"
                      onClick={() => navigator.clipboard?.writeText(c.password)}
                    >⧉</button>
                  </div>
                </td>
                <td>
                  <select value={c.socioId ?? ""} onChange={(e) => onEditar(c.id, "socioId", e.target.value)}>
                    <option value="">— minha —</option>
                    {socios.map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </td>
                <td><input value={c.notas} placeholder="nota" onChange={(e) => onEditar(c.id, "notas", e.target.value)} /></td>
                <td className="dir"><button className="btn fantasma" title="Apagar conta" onClick={() => onApagar(c.id)}>✕</button></td>
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr><td colSpan={6} className="vazio" style={{ padding: "14px 8px" }}>Sem contas {filtro !== "todos" ? "neste filtro" : "guardadas"}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <form className="cofre-nova" onSubmit={criar}>
        <input value={nova.plataforma} onChange={setNovaCampo("plataforma")} placeholder="Plataforma (ex: Instagram)" />
        <input value={nova.utilizador} onChange={setNovaCampo("utilizador")} placeholder="Utilizador" />
        <input value={nova.password} onChange={setNovaCampo("password")} placeholder="Password" />
        <select value={nova.socioId} onChange={setNovaCampo("socioId")}>
          <option value="">— minha —</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <button className="btn" type="submit">+ Adicionar conta</button>
      </form>
    </div>
  );
}
