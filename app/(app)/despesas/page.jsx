"use client";

import { useEstado } from "@/app/components/contexto";
import Despesas from "@/app/components/Despesas";

// Página das despesas (recorrentes ou únicas; saem do lucro real).
export default function PaginaDespesas() {
  const { estado, resumo, editarCampo, novaDespesa, apagarDespesa } = useEstado();

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>Despesas <span className="conta">— saem do lucro real ({resumo.mesesAtivos} mes(es) ativos)</span></h2>
        <Despesas
          despesas={estado.despesas} socios={estado.socios}
          onEditar={(id, campo, valor) => editarCampo("despesas", id, campo, valor)}
          onCriar={novaDespesa} onApagar={apagarDespesa}
        />
      </section>
    </div>
  );
}
