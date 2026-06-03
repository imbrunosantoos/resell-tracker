"use client";

import { useState } from "react";
import { useIdioma } from "./Idioma";

// Despesas recorrentes ou únicas (chip, domínio, sacos a granel...). Podes marcar se
// foi só tua ou dividida com um sócio (aí só metade sai do teu lucro). O total a
// nível de negócio sai do "lucro real" lá em cima. Edição inline com debounce.
export default function Despesas({ despesas, socios, onEditar, onCriar, onApagar }) {
  const { t } = useIdioma();
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
              placeholder={t("desp.phNomeLinha")}
              onChange={(e) => onEditar(d.id, "nome", e.target.value)}
            />
            <input
              className="num" type="number" step="0.01" placeholder="€"
              value={d.valor}
              onChange={(e) => onEditar(d.id, "valor", e.target.value)}
            />
            <input
              type="date" className="desp-data" title={t("desp.dataTitulo")}
              value={d.data || ""} onChange={(e) => onEditar(d.id, "data", e.target.value)}
            />
            <select value={d.periodo} onChange={(e) => onEditar(d.id, "periodo", e.target.value)}>
              <option value="mensal">{t("desp.porMes")}</option>
              <option value="unico">{t("desp.umaVez")}</option>
            </select>
            <select
              value={d.socioId ?? ""}
              title={t("desp.comQuemTitulo")}
              onChange={(e) => onEditar(d.id, "socioId", e.target.value)}
            >
              <option value="">{t("filtros.sozinho")}</option>
              {socios.map((s) => (
                <option key={s.id} value={s.id}>½ {s.nome}</option>
              ))}
            </select>
            <button className="btn fantasma" title={t("desp.apagarTitulo")} onClick={() => onApagar(d.id)}>✕</button>
          </div>
        ))}
        {despesas.length === 0 && (
          <p className="dim pequeno">{t("desp.vazio")}</p>
        )}
      </div>

      <form className="form-novo" style={{ marginTop: 12 }} onSubmit={criar}>
        <label className="campo">
          <span>{t("comum.nome")}</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t("desp.phNomeForm")} />
        </label>
        <label className="campo">
          <span>{t("desp.valor")}</span>
          <input className="num" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
        </label>
        <label className="campo">
          <span>{t("desp.periodo")}</span>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="mensal">{t("desp.porMes")}</option>
            <option value="unico">{t("desp.umaVez")}</option>
          </select>
        </label>
        <label className="campo">
          <span>{t("desp.data")}</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="campo">
          <span>{t("desp.comQuem")}</span>
          <select value={socioId} onChange={(e) => setSocioId(e.target.value)}>
            <option value="">{t("filtros.sozinho")}</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>½ {t("desp.com")} {s.nome}</option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit">{t("desp.adicionar")}</button>
      </form>
    </>
  );
}
