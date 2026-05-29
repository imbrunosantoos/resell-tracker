"use client";

import { useState } from "react";

const INICIAL = { nome: "", dataCompra: "", dataChegada: "", taxaPaypal: "3.99", saco: "0.17", socioId: "" };

export default function NovoPedido({ socios, onCriar }) {
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
        <span>Nome do pedido</span>
        <input value={form.nome} onChange={set("nome")} placeholder="ex: Lote 02 — futebol" />
      </label>
      <label className="campo">
        <span>Sócio</span>
        <select value={form.socioId} onChange={set("socioId")}>
          <option value="">Sozinho</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
      </label>
      <label className="campo">
        <span>Data compra</span>
        <input type="date" value={form.dataCompra} onChange={set("dataCompra")} />
      </label>
      <label className="campo">
        <span>Data chegada</span>
        <input type="date" value={form.dataChegada} onChange={set("dataChegada")} />
      </label>
      <label className="campo">
        <span>Taxa PayPal (€)</span>
        <input className="num" type="number" step="0.01" value={form.taxaPaypal} onChange={set("taxaPaypal")} />
      </label>
      <label className="campo">
        <span>Saco / peça (€)</span>
        <input className="num" type="number" step="0.01" value={form.saco} onChange={set("saco")} />
      </label>
      <button className="btn primario" type="submit">+ Criar pedido</button>
    </form>
  );
}
