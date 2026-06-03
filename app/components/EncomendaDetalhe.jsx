"use client";

import { useRouter } from "next/navigation";
import { useEstado } from "./contexto";
import { useIdioma } from "./Idioma";
import { eur, margem, margemPct } from "@/lib/calculos";

// Detalhe de uma ENCOMENDA (pré-pedido pago adiantado): vista simplificada, sem
// grelha de itens. Opera sobre o único item sintético (pedido.itens[0]), que
// carrega o custo total (precoCompra) e o preço final (precoVenda).
export default function EncomendaDetalhe({ pedido }) {
  const router = useRouter();
  const { t } = useIdioma();
  const { estado, editarCampo, apagarPedido } = useEstado();
  const socios = estado.socios;
  const item = pedido.itens[0] || {};

  const editP = (campo, valor) => editarCampo("pedidos", pedido.id, campo, valor);
  const editI = (campo, valor) => editarCampo("itens", item.id, campo, valor);

  // A data de pagamento é a data de venda do item — manter os dois em sincronia.
  // Ignora vazio (não deixar a encomenda "desaparecer" dos relatórios).
  function editarPagamento(valor) {
    if (!valor) return;
    editP("dataPagamento", valor);
    editI("dataVenda", valor);
  }

  async function aoApagar() {
    const ok = await apagarPedido(pedido.id);
    if (ok) router.replace("/pedidos");
  }

  const lucro = margem(pedido, item) ?? 0;
  const pct = margemPct(pedido, item);

  return (
    <article className="detalhe">
      <div className="detalhe-topo">
        <div className="detalhe-cab">
          <input className="detalhe-titulo" value={pedido.nome} onChange={(e) => editP("nome", e.target.value)} />
          <span className="chip encomenda">{t("comum.encomenda")}</span>
          <button className="btn fantasma" title={t("enc.apagarTitulo")} onClick={aoApagar}>{t("enc.apagar")}</button>
        </div>

        <div className="pedido-meta">
          <label className="campo"><span>{t("enc.cliente")}</span>
            <input value={pedido.cliente} onChange={(e) => editP("cliente", e.target.value)} placeholder={t("enc.phCliente")} /></label>
          <label className="campo"><span>{t("contas.socio")}</span>
            <select value={pedido.socioId ?? ""} onChange={(e) => editP("socioId", e.target.value)}>
              <option value="">{t("filtros.sozinho")}</option>
              {socios.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select></label>
          <label className="campo"><span>{t("enc.dataPagamento")}</span>
            <input type="date" value={pedido.dataPagamento} onChange={(e) => editarPagamento(e.target.value)} required /></label>
          <label className="campo"><span>{t("enc.dataCompra")}</span>
            <input type="date" value={pedido.dataCompra} onChange={(e) => editP("dataCompra", e.target.value)} /></label>
          <label className="campo"><span>{t("enc.custoTotal")}</span>
            <input className="num pequeno" type="number" step="0.01" value={item.precoCompra} onChange={(e) => editI("precoCompra", e.target.value)} /></label>
          <label className="campo"><span>{t("enc.precoFinal")}</span>
            <input className="num pequeno" type="number" step="0.01" value={item.precoVenda} onChange={(e) => editI("precoVenda", e.target.value)} /></label>
        </div>

        <div className="pills">
          <div className="pill"><div className="pill-label">{t("enc.custo")}</div><div className="pill-valor">{eur(Number(item.precoCompra) || 0)}</div></div>
          <div className="pill"><div className="pill-label">{t("enc.precoFinalPill")}</div><div className="pill-valor">{eur(Number(item.precoVenda) || 0)}</div></div>
          <div className="pill azul"><div className="pill-label">{t("vendas.lucro")}</div><div className="pill-valor">{eur(lucro)}</div></div>
          <div className="pill"><div className="pill-label">{t("enc.margem")}</div><div className="pill-valor">{pct !== null ? `${pct}%` : "—"}</div></div>
        </div>
      </div>
    </article>
  );
}
