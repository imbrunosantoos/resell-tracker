"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { eur, previsaoCaixa } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";
import ModalData from "@/app/components/ModalData";
import PrevisaoCaixa from "@/app/components/PrevisaoCaixa";

// Aba Vendas: fluxo de caixa. Cartões-resumo em cima; grelha 2:1 com as listas
// Pendentes/Concluídas (toggle no cabeçalho do painel) e a previsão de caixa
// ao lado. Só as concluídas se acertam com o sócio (na aba Sócios).
export default function PaginaVendas() {
  const { vendas, estado, marcarRecebido } = useEstado();
  const { t } = useIdioma();
  const [vista, setVista] = useState("pendentes"); // "pendentes" | "concluidos"
  const [recebendo, setRecebendo] = useState(null); // { pedido, item } a marcar recebido
  const previsao = useMemo(() => previsaoCaixa(estado), [estado]);

  return (
    <div className="pagina">
      <div className="cartoes">
        <div className="cartao destaque">
          <span className="cartao-label">{t("vendas.aTuaParte")}</span>
          <span className="cartao-valor">{eur(vendas.minhaPartePendente)}</span>
        </div>
        <div className="cartao">
          <span className="cartao-label">{t("vendas.recebidoMes")}</span>
          <span className="cartao-valor teal">{eur(vendas.recebidoMes)}</span>
        </div>
        <div className="cartao">
          <span className="cartao-label">{t("vendas.nPendentes")}</span>
          <span className="cartao-valor">{vendas.nPendentes}</span>
        </div>
      </div>

      <div className="g-main">
        <div className="g-2">
          <section className="painel">
            <div className="painel-cab">
              <span className="painel-titulo">{t("vendas.titulo")}</span>
              <span className="painel-sub">{t("vendas.subFluxo")}</span>
              <div className="painel-acoes">
                <div className="grafico-toggle" style={{ marginBottom: 0 }}>
                  <button className={vista === "pendentes" ? "ativo" : ""} onClick={() => setVista("pendentes")}>
                    {t("vendas.pendentes")} ({vendas.nPendentes})
                  </button>
                  <button className={vista === "concluidos" ? "ativo" : ""} onClick={() => setVista("concluidos")}>
                    {t("vendas.concluidos")} ({vendas.nConcluidos})
                  </button>
                </div>
              </div>
            </div>

            {vista === "pendentes" ? (
              vendas.pendentes.length === 0 ? (
                <p className="dim pequeno">{t("vendas.vazioPendentes")}</p>
              ) : (
                <div className="acerto-lista">
                  {vendas.pendentes.map(({ pedido, item, minhaParte, dias }) => (
                    <div className="venda-acerto" key={item.id}>
                      <span className="venda-acerto-txt">
                        <span className="venda-dot" style={{ background: corCategoria(item.categoria) }} />
                        <Link href={`/pedidos/${pedido.id}`}>{item.nome || t("comum.semNome")}</Link>
                        <span className="dim"> · {pedido.nome} · {item.dataVenda}</span>
                      </span>
                      <span className="venda-acerto-vals">
                        {dias !== null && <span className="badge">⏳ {t("vendas.diasEspera", { n: dias })}</span>}
                        <span className="venda-acerto-meia pos">{eur(item.precoVenda)} <span className="dim">· {t("vendas.tua")} {eur(minhaParte)}</span></span>
                      </span>
                      <button className="btn mini" onClick={() => setRecebendo({ pedido, item })}>{t("vendas.marcarRecebido")}</button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              vendas.concluidos.length === 0 ? (
                <p className="dim pequeno">{t("vendas.vazioConcluidos")}</p>
              ) : (
                <div className="acerto-lista">
                  {vendas.concluidos.map(({ pedido, item, minhaParte }) => (
                    <div className="venda-acerto feita" key={item.id}>
                      <span className="venda-acerto-txt">
                        ✓ <Link href={`/pedidos/${pedido.id}`}>{item.nome || t("comum.semNome")}</Link>
                        <span className="dim"> · {pedido.nome} · {t("vendas.recebidoEm", { data: item.dataRecebido })}</span>
                      </span>
                      <span className="venda-acerto-vals">
                        <span className="venda-acerto-meia dim">{eur(item.precoVenda)} · {t("vendas.tua")} {eur(minhaParte)}</span>
                      </span>
                      <button className="btn mini fantasma" onClick={() => marcarRecebido(pedido.id, item.id, "")}>{t("vendas.desfazerRecebido")}</button>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>

          <section className="painel">
            <div className="painel-cab">
              <span className="painel-titulo">{t("caixa.titulo")}</span>
            </div>
            <PrevisaoCaixa previsao={previsao} />
          </section>
        </div>
      </div>

      {recebendo && (
        <ModalData
          titulo={t("vendas.tituloRecebido")}
          sub={recebendo.item.nome || t("comum.semNome")}
          rotulo={t("vendas.dataRecebido")}
          onConfirmar={(data) => { marcarRecebido(recebendo.pedido.id, recebendo.item.id, data); setRecebendo(null); }}
          onFechar={() => setRecebendo(null)}
        />
      )}
    </div>
  );
}
