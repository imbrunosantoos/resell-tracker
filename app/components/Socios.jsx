"use client";

import { useState } from "react";
import { eur } from "@/lib/calculos";
import { useIdioma } from "./Idioma";

// Gestão de sócios + acerto de contas POR VENDA. Cada item vendido de um pedido
// com sócio vale metade do lucro para ele; marcas a venda como "acertada" quando
// já lhe pagaste e o saldo atualiza-se.
export default function Socios({ socios, acerto, onCriar, onEditar, onApagar, onAcertar }) {
  const { t } = useIdioma();
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
      {socios.map((s) => (
        <SocioCartao key={s.id} socio={s} dados={dadosDe(s.id)} onEditar={onEditar} onApagar={onApagar} onAcertar={onAcertar} />
      ))}

      {socios.length === 0 && (
        <p className="dim pequeno">{t("socios.semSocios")}</p>
      )}

      <form className="form-inline" onSubmit={criar}>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t("socios.nomePlaceholder")} />
        <button className="btn" type="submit">{t("socios.adicionarSocio")}</button>
      </form>
    </>
  );
}

function SocioCartao({ socio, dados, onEditar, onApagar, onAcertar }) {
  const { t } = useIdioma();
  const [verAcertadas, setVerAcertadas] = useState(false);
  const d = dados ?? { devido: 0, acertado: 0, falta: 0, investido: 0, porAcertar: [], jaAcertadas: [] };

  return (
    <div className="socio-cartao">
      <div className="socio-linha">
        <input className="socio-nome-input" value={socio.nome} onChange={(e) => onEditar(socio.id, "nome", e.target.value)} />
        <span className="socio-pedidos">{t("socios.porAcertar", { n: d.porAcertar.length })}</span>
        <span className={"socio-lucro " + (d.falta > 0.005 ? "neg" : "pos")}>{eur(d.falta)}</span>
        <button className="btn fantasma" title={t("socios.apagarSocio")} onClick={() => onApagar(socio.id)}>✕</button>
      </div>

      <div className="acerto-resumo">
        <span className="dim">{t("socios.investiu")}: <b>{eur(d.investido)}</b></span>
        <span className="dim">{t("socios.jaAcertado")} <b>{eur(d.acertado)}</b></span>
        <span>{t("socios.faltaEnviar")} <b className={d.falta > 0.005 ? "neg" : "pos"}>{eur(d.falta)}</b></span>
      </div>

      {d.porAcertar.length > 0 && (
        <div className="acerto-lista">
          {d.porAcertar.map(({ pedido, item, lucro, enviar }) => (
            <div className="venda-acerto" key={item.id}>
              <span className="venda-acerto-txt">
                {item.nome || t("comum.item")} <span className="dim">· {pedido.nome} · {item.dataVenda}</span>
              </span>
              <span className="venda-acerto-vals">
                <span className="dim">{t("socios.lucro")} {eur(lucro)}</span>
                <span className="venda-acerto-meia pos">{t("socios.enviar")} {eur(enviar)}</span>
              </span>
              <button className="btn mini" onClick={() => onAcertar(item.id, true)}>{t("socios.acertar")}</button>
            </div>
          ))}
        </div>
      )}
      {d.porAcertar.length === 0 && d.devido > 0 && (
        <p className="dim pequeno" style={{ padding: "0 12px" }}>{t("socios.tudoAcertado")}</p>
      )}

      {d.jaAcertadas.length > 0 && (
        <div className="acerto-lista">
          <button className="acerto-toggle" onClick={() => setVerAcertadas((v) => !v)}>
            {verAcertadas ? t("socios.esconder") : t("socios.verAcertadas", { n: d.jaAcertadas.length })}
          </button>
          {verAcertadas && d.jaAcertadas.map(({ pedido, item, lucro, enviar }) => (
            <div className="venda-acerto feita" key={item.id}>
              <span className="venda-acerto-txt">
                ✓ {item.nome || t("comum.item")} <span className="dim">· {pedido.nome} · {item.dataVenda}</span>
              </span>
              <span className="venda-acerto-vals">
                <span className="dim">{t("socios.lucro")} {eur(lucro)}</span>
                <span className="venda-acerto-meia dim">{t("socios.enviado")} {eur(enviar)}</span>
              </span>
              <button className="btn mini fantasma" onClick={() => onAcertar(item.id, false)}>{t("socios.desfazer")}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
