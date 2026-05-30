"use client";

import { useState } from "react";
import { eur } from "@/lib/calculos";

// Gestão de sócios + quanto cada um tem a receber. O lucro de cada pedido
// feito com um sócio é dividido a meias; aqui mostra-se a soma por sócio.
export default function Socios({ socios, porSocio, meuLucro, onCriar, onEditar, onApagar }) {
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

        {socios.map((s) => {
          const info = lucroDe(s.id);
          return (
            <div className="socio-linha" key={s.id}>
              <input
                className="socio-nome-input"
                value={s.nome}
                onChange={(e) => onEditar(s.id, "nome", e.target.value)}
              />
              <span className="socio-pedidos">{info ? `${info.pedidos} pedido(s)` : "—"}</span>
              <span className={"socio-lucro " + (info && info.lucro < 0 ? "neg" : "pos")}>
                {eur(info?.lucro ?? 0)}
              </span>
              <button className="btn fantasma" title="Apagar sócio" onClick={() => onApagar(s.id)}>✕</button>
            </div>
          );
        })}

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
