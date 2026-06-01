"use client";

import { useState } from "react";
import { eur, toNumber } from "@/lib/calculos";
import SugestoesTexto from "./SugestoesTexto";

const hoje = () => new Date().toISOString().slice(0, 10);
const INICIAL = () => ({ cliente: "", socioId: "", custoTotal: "", precoFinal: "", dataPagamento: hoje() });

// Encomenda (pré-pedido pago adiantado): bloco único custo + preço final.
// São sempre camisas de futebol; o lucro está fechado, por isso conta logo como
// vendida. O nome do pedido é gerado no servidor: "<Cliente> NN".
export default function NovaEncomenda({ socios, clientes = [], onCriar }) {
  const [form, setForm] = useState(INICIAL);
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const custo = toNumber(form.custoTotal);
  const preco = toNumber(form.precoFinal);
  const lucro = preco - custo;
  const pct = preco > 0 ? Math.round((lucro / preco) * 100) : 0;

  function criar(e) {
    e.preventDefault();
    if (!form.cliente.trim() || preco <= 0) return; // cliente dá o nome; sem preço não faz sentido
    onCriar({ ...form, dataPagamento: form.dataPagamento || hoje() });
    setForm(INICIAL());
  }

  return (
    <form className="form-novo" onSubmit={criar}>
      <label className="campo">
        <span>Cliente</span>
        <SugestoesTexto
          value={form.cliente} opcoes={clientes} required
          onChange={(v) => setForm((f) => ({ ...f, cliente: v }))}
          placeholder="nome do cliente"
        />
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
      <div className="encomenda-lucro">
        Lucro: <b className={lucro >= 0 ? "pos" : "neg"}>{eur(lucro)}</b>
        {preco > 0 && <span className="dim"> · {pct}%</span>}
      </div>
      <button className="btn primario" type="submit">+ Criar encomenda</button>
    </form>
  );
}
