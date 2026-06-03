"use client";

import { useState } from "react";
import { useIdioma } from "./Idioma";

// Cofre de contas: login/password por plataforma, agrupável por sócio.
// As passwords vêm já decifradas do servidor; aqui ficam escondidas até
// carregares em "ver". Tabela estilo folha de cálculo, editável em linha.
const NOVA = { plataforma: "", utilizador: "", password: "", socioId: "", notas: "" };

export default function Credenciais({ credenciais, socios, onCriar, onEditar, onApagar }) {
  const { t } = useIdioma();
  const [reveladas, setReveladas] = useState(() => new Set());
  const [nova, setNova] = useState(NOVA);

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
        <span className="dim pequeno">{t("contas.contagem", { n: credenciais.length })}</span>
      </div>

      <div className="tabela-scroll">
        <table className="cofre-tabela">
          <thead>
            <tr>
              <th>{t("contas.plataforma")}</th>
              <th>{t("login.utilizador")}</th>
              <th>{t("login.password")}</th>
              <th>{t("contas.socio")}</th>
              <th>{t("contas.notas")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {credenciais.map((c) => (
              <tr key={c.id}>
                <td><input value={c.plataforma} placeholder={t("contas.phPlataforma")} onChange={(e) => onEditar(c.id, "plataforma", e.target.value)} /></td>
                <td><input value={c.utilizador} placeholder={t("contas.phUtilizador")} onChange={(e) => onEditar(c.id, "utilizador", e.target.value)} /></td>
                <td>
                  <div className="cofre-pass">
                    <input
                      type={reveladas.has(c.id) ? "text" : "password"}
                      value={c.password}
                      placeholder="••••••"
                      onChange={(e) => onEditar(c.id, "password", e.target.value)}
                    />
                    <button className="btn fantasma mini" type="button" title={t("contas.verEsconder")} onClick={() => alternarVer(c.id)}>
                      {reveladas.has(c.id) ? "🙈" : "👁"}
                    </button>
                    <button
                      className="btn fantasma mini" type="button" title={t("contas.copiar")}
                      onClick={() => navigator.clipboard?.writeText(c.password)}
                    >⧉</button>
                  </div>
                </td>
                <td>
                  <select value={c.socioId ?? ""} onChange={(e) => onEditar(c.id, "socioId", e.target.value)}>
                    <option value="">{t("contas.minha")}</option>
                    {socios.map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </td>
                <td><input value={c.notas} placeholder={t("contas.phNota")} onChange={(e) => onEditar(c.id, "notas", e.target.value)} /></td>
                <td className="dir"><button className="btn fantasma" title={t("contas.apagar")} onClick={() => onApagar(c.id)}>✕</button></td>
              </tr>
            ))}
            {credenciais.length === 0 && (
              <tr><td colSpan={6} className="vazio" style={{ padding: "14px 8px" }}>{t("contas.vazio")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <form className="cofre-nova" onSubmit={criar}>
        <input value={nova.plataforma} onChange={setNovaCampo("plataforma")} placeholder={t("contas.phPlataformaForm")} />
        <input value={nova.utilizador} onChange={setNovaCampo("utilizador")} placeholder={t("login.utilizador")} />
        <input value={nova.password} onChange={setNovaCampo("password")} placeholder={t("login.password")} />
        <select value={nova.socioId} onChange={setNovaCampo("socioId")}>
          <option value="">{t("contas.minha")}</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <button className="btn" type="submit">{t("contas.adicionar")}</button>
      </form>
    </div>
  );
}
