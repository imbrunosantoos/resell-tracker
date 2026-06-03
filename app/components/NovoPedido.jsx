"use client";

import { useState } from "react";
import { useIdioma } from "./Idioma";

const INICIAL = { nome: "", dataCompra: "", dataChegada: "", taxaPaypal: "3.99", saco: "0.17", socioId: "" };

export default function NovoPedido({ socios, onCriar }) {
  const { t } = useIdioma();
  const [form, setForm] = useState(INICIAL);
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function criar(e) {
    e.preventDefault();
    onCriar(form);
    setForm(INICIAL);
  }

  return (
    <form className="form-novo" onSubmit={criar}>
      <label className="campo">
        <span>{t("novo.nomePedido")}</span>
        <input value={form.nome} onChange={set("nome")} placeholder={t("novo.phNome2")} />
      </label>
      <label className="campo">
        <span>{t("contas.socio")}</span>
        <select value={form.socioId} onChange={set("socioId")}>
          <option value="">{t("filtros.sozinho")}</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </label>
      <label className="campo">
        <span>{t("novo.dataCompra")}</span>
        <input type="date" value={form.dataCompra} onChange={set("dataCompra")} />
      </label>
      <label className="campo">
        <span>{t("novo.dataChegada")}</span>
        <input type="date" value={form.dataChegada} onChange={set("dataChegada")} />
      </label>
      <label className="campo">
        <span>{t("novo.taxaPaypal")}</span>
        <input className="num" type="number" step="0.01" value={form.taxaPaypal} onChange={set("taxaPaypal")} />
      </label>
      <label className="campo">
        <span>{t("novo.saco")}</span>
        <input className="num" type="number" step="0.01" value={form.saco} onChange={set("saco")} />
      </label>
      <button className="btn primario" type="submit">{t("novo.criarBtn")}</button>
    </form>
  );
}
