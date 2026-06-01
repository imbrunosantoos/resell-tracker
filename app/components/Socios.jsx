"use client";

import { useState } from "react";
import { eur, toNumber, pagoAoSocio } from "@/lib/calculos";

const hoje = () => new Date().toISOString().slice(0, 10);

// Gestão de sócios + acerto de contas. O lucro de cada pedido feito com um sócio
// divide-se a meias; aqui mostra-se a parte dele, quanto já foi acertado (pago) e
// quanto falta, e dá para registar pagamentos.
export default function Socios({ socios, porSocio, meuLucro, acertos = [], onCriar, onEditar, onApagar, onNovoAcerto, onApagarAcerto }) {
  const [nome, setNome] = useState("");
  const lucroDe = (id) => porSocio.find((s) => s.id === id);

  function criar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    onCriar({ nome });
    setNome("");
  }

  return (
    <>
      <div className="socios-lista">
        <div className="socio-linha eu">
          <span className="socio-nome">Bubu</span>
          <span className="socio-pedidos" />
          <span className={"socio-lucro " + (meuLucro < 0 ? "neg" : "pos")}>{eur(meuLucro)}</span>
          <span />
        </div>

        {socios.map((s) => (
          <SocioCartao
            key={s.id} socio={s} info={lucroDe(s.id)}
            acertos={acertos.filter((a) => a.socioId === s.id)}
            onEditar={onEditar} onApagar={onApagar}
            onNovoAcerto={onNovoAcerto} onApagarAcerto={onApagarAcerto}
          />
        ))}

        {socios.length === 0 && (
          <p className="dim pequeno">Sem sócios. Adiciona um abaixo para poderes atribuir pedidos.</p>
        )}
      </div>

      <form className="form-inline" onSubmit={criar}>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do sócio" />
        <button className="btn" type="submit">+ Adicionar sócio</button>
      </form>
    </>
  );
}

function SocioCartao({ socio, info, acertos, onEditar, onApagar, onNovoAcerto, onApagarAcerto }) {
  const devido = info?.lucro ?? 0;
  const pago = pagoAoSocio(acertos, socio.id);
  const falta = devido - pago;

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(() => ({ valor: "", sentido: "para_socio", data: hoje(), nota: "" }));
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function abrir() {
    setForm({ valor: falta > 0 ? falta.toFixed(2) : "", sentido: "para_socio", data: hoje(), nota: "" });
    setAberto(true);
  }
  function registar(e) {
    e.preventDefault();
    if (toNumber(form.valor) <= 0) return;
    onNovoAcerto({ socioId: socio.id, ...form });
    setAberto(false);
  }

  return (
    <div className="socio-cartao">
      <div className="socio-linha">
        <input className="socio-nome-input" value={socio.nome} onChange={(e) => onEditar(socio.id, "nome", e.target.value)} />
        <span className="socio-pedidos">{info ? `${info.pedidos} pedido(s)` : "—"}</span>
        <span className={"socio-lucro " + (devido < 0 ? "neg" : "pos")}>{eur(devido)}</span>
        <button className="btn fantasma" title="Apagar sócio" onClick={() => onApagar(socio.id)}>✕</button>
      </div>

      <div className="acerto-resumo">
        <span className="dim">Já acertado: <b>{eur(pago)}</b></span>
        <span>Falta: <b className={falta > 0.005 ? "neg" : "pos"}>{eur(falta)}</b></span>
        <button className="btn mini" onClick={() => (aberto ? setAberto(false) : abrir())}>
          {aberto ? "Cancelar" : "Registar acerto"}
        </button>
      </div>

      {aberto && (
        <form className="acerto-form" onSubmit={registar}>
          <select value={form.sentido} onChange={set("sentido")}>
            <option value="para_socio">Eu paguei-lhe</option>
            <option value="do_socio">Recebi dele</option>
          </select>
          <input className="num" type="number" step="0.01" value={form.valor} onChange={set("valor")} placeholder="€" />
          <input type="date" value={form.data} onChange={set("data")} />
          <input value={form.nota} onChange={set("nota")} placeholder="nota (opcional)" />
          <button className="btn mini primario" type="submit">Guardar</button>
        </form>
      )}

      {acertos.length > 0 && (
        <div className="acerto-lista">
          {acertos.map((a) => (
            <div className="acerto-linha" key={a.id}>
              <span className="acerto-txt">
                <b>{a.sentido === "do_socio" ? "Recebido" : "Pago"}</b> {eur(toNumber(a.valor))}
                <span className="dim"> · {a.data}{a.nota ? ` · ${a.nota}` : ""}</span>
              </span>
              <button className="btn fantasma" title="Apagar acerto" onClick={() => onApagarAcerto(a.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
