"use client";

import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import Despesas from "@/app/components/Despesas";

// Página das despesas (recorrentes ou únicas; saem do lucro real).
export default function PaginaDespesas() {
  const { estado, resumo, editarCampo, novaDespesa, apagarDespesa } = useEstado();
  const { t } = useIdioma();

  return (
    <div className="pagina">
      <div className="g-main">
        <section className="painel">
          <div className="painel-cab">
            <span className="painel-titulo">{t("nav.despesas")}</span>
            <span className="painel-sub">{t("desp.subLucroReal", { n: resumo.mesesAtivos })}</span>
          </div>
          <Despesas
            despesas={estado.despesas} socios={estado.socios}
            onEditar={(id, campo, valor) => editarCampo("despesas", id, campo, valor)}
            onCriar={novaDespesa} onApagar={apagarDespesa}
          />
        </section>
      </div>
    </div>
  );
}
