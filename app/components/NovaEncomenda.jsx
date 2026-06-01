"use client";

import { useState } from "react";
import { eur, toNumber } from "@/lib/calculos";

const hoje = () => new Date().toISOString().slice(0, 10);
const INICIAL = () => ({ nome: "", cliente: "", socioId: "", custoTotal: "", precoFinal: "", dataPagamento: hoje(), dataCompra: "" });

// Encomenda (pré-pedido pago adiantado): bloco único custo + preço final.
// São sempre camisas de futebol; o lucro está fechado, por isso conta logo
// como vendida.
export default function NovaEncomenda({ socios, onCriar }) {
  const [form, setForm] = useState(INICIAL);
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const lucro = toNumber(form.precoFinal) - toNumber(form.custoTotal);

  function criar(e) {
    e.preventDefault();
    if (toNumber(form.precoFinal) <= 0) return; // sem preço não faz sentido
    onCriar({ ...form, dataPagamento: form.dataPagamento || hoje() });
    setForm(INICIAL());
  }

  return (
    <form className="form-novo" onSubmit={criar}>
      <label className="campo">
        <span>Nome (opcional)</span>
        <input value={form.nome} onChange={set("nome")} placeholder="ex: Encomenda do João" />
      </label>
      <label className="campo">
        <span>Cliente</span>
        <input value={form.cliente} onChange={set("cliente")} placeholder="nome do cliente" />
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
        <span>Custo total (€)</span>
        <input className="num" type="number" step="0.01" value={form.custoTotal} onChange={set("custoTotal")} placeholder="o que vais pagar" />
      </label>
      <label className="campo">
        <span>Preço final (€)</span>
        <input className="num" type="number" step="0.01" value={form.precoFinal} onChange={set("precoFinal")} placeholder="o que o cliente pagou" />
      </label>
      <label className="campo">
        <span>Data de pagamento</span>
        <input type="date" value={form.dataPagamento} onChange={set("dataPagamento")} />
      </label>
      <label className="campo">
        <span>Data de compra (opcional)</span>
        <input type="date" value={form.dataCompra} onChange={set("dataCompra")} />
      </label>
      <div className="encomenda-lucro">
        Lucro: <b className={lucro >= 0 ? "pos" : "neg"}>{eur(lucro)}</b>
      </div>
      <button className="btn primario" type="submit">+ Criar encomenda</button>
    </form>
  );
}
