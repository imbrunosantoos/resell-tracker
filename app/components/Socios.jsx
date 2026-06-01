"use client";

import { useState } from "react";
import { eur } from "@/lib/calculos";

// Gestão de sócios + acerto de contas POR VENDA. Cada item vendido de um pedido
// com sócio vale metade do lucro para ele; marcas a venda como "acertada" quando
// já lhe pagaste e o saldo atualiza-se.
export default function Socios({ socios, acerto, meuLucro, onCriar, onEditar, onApagar, onAcertar }) {
  const [nome, setNome] = useState("");
  const dadosDe = (id) => acerto.find((a) => a.id === id);

  function criar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    onCriar({ nome });
    setNome("");
  }

  return (
    <>
      <div className="socio-linha eu">
        <span className="socio-nome">Bubu</span>
        <span />
        <span className={"socio-lucro " + (meuLucro < 0 ? "neg" : "pos")}>{eur(meuLucro)}</span>
        <span />
      </div>

      {socios.map((s) => (
        <SocioCartao key={s.id} socio={s} dados={dadosDe(s.id)} onEditar={onEditar} onApagar={onApagar} onAcertar={onAcertar} />
      ))}

      {socios.length === 0 && (
        <p className="dim pequeno">Sem sócios. Adiciona um abaixo para poderes atribuir pedidos.</p>
      )}

      <form className="form-inline" onSubmit={criar}>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do sócio" />
        <button className="btn" type="submit">+ Adicionar sócio</button>
      </form>
    </>
  );
}

function SocioCartao({ socio, dados, onEditar, onApagar, onAcertar }) {
  const [verAcertadas, setVerAcertadas] = useState(false);
  const d = dados ?? { devido: 0, acertado: 0, falta: 0, porAcertar: [], jaAcertadas: [] };

  return (
    <div className="socio-cartao">
      <div className="socio-linha">
        <input className="socio-nome-input" value={socio.nome} onChange={(e) => onEditar(socio.id, "nome", e.target.value)} />
        <span className="socio-pedidos">{d.porAcertar.length} por acertar</span>
        <span className={"socio-lucro " + (d.devido < 0 ? "neg" : "pos")}>{eur(d.devido)}</span>
        <button className="btn fantasma" title="Apagar sócio" onClick={() => onApagar(socio.id)}>✕</button>
      </div>

      <div className="acerto-resumo">
        <span className="dim">Já acertado: <b>{eur(d.acertado)}</b></span>
        <span>Falta pagar: <b className={d.falta > 0.005 ? "neg" : "pos"}>{eur(d.falta)}</b></span>
      </div>

      {d.porAcertar.length > 0 && (
        <div className="acerto-lista">
          {d.porAcertar.map(({ pedido, item, metade }) => (
            <div className="venda-acerto" key={item.id}>
              <span className="venda-acerto-txt">
                {item.nome || "Item"} <span className="dim">· {pedido.nome} · {item.dataVenda}</span>
              </span>
              <span className="venda-acerto-meia pos">{eur(metade)}</span>
              <button className="btn mini" onClick={() => onAcertar(item.id, true)}>Acertar</button>
            </div>
          ))}
        </div>
      )}
      {d.porAcertar.length === 0 && d.devido > 0 && (
        <p className="dim pequeno" style={{ padding: "0 12px" }}>Tudo acertado com este sócio 👌</p>
      )}

      {d.jaAcertadas.length > 0 && (
        <div className="acerto-lista">
          <button className="acerto-toggle" onClick={() => setVerAcertadas((v) => !v)}>
            {verAcertadas ? "Esconder" : `Ver ${d.jaAcertadas.length} já acertada(s)`}
          </button>
          {verAcertadas && d.jaAcertadas.map(({ pedido, item, metade }) => (
            <div className="venda-acerto feita" key={item.id}>
              <span className="venda-acerto-txt">
                ✓ {item.nome || "Item"} <span className="dim">· {pedido.nome} · {item.dataVenda}</span>
              </span>
              <span className="venda-acerto-meia dim">{eur(metade)}</span>
              <button className="btn mini fantasma" onClick={() => onAcertar(item.id, false)}>Desfazer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
