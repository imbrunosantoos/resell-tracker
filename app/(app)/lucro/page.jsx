"use client";

import { useEstado } from "@/app/components/contexto";
import GraficoMensal from "@/app/components/GraficoMensal";
import Categorias from "@/app/components/Categorias";
import Socios from "@/app/components/Socios";
import Despesas from "@/app/components/Despesas";

// Página de análise: gráfico mensal, lucro por sócio, categorias e despesas.
export default function PaginaLucro() {
  const {
    estado, resumo, categorias, mensal,
    editarCampo, novoSocio, apagarSocio, novaDespesa, apagarDespesa,
  } = useEstado();

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>Lucro por mês</h2>
        <GraficoMensal dados={mensal} />
      </section>

      <section className="bloco">
        <h2>Sócios <span className="conta">— Lucro por sócio</span></h2>
        <Socios
          socios={estado.socios} porSocio={resumo.porSocio} meuLucro={resumo.meuLucro}
          onCriar={novoSocio}
          onEditar={(id, campo, valor) => editarCampo("socios", id, campo, valor)}
          onApagar={apagarSocio}
        />
      </section>

      <section className="bloco">
        <h2>Lucro por categoria</h2>
        <Categorias categorias={categorias} />
      </section>

      <section className="bloco">
        <h2>Despesas fixas <span className="conta">— saem do lucro real ({resumo.mesesAtivos} mes(es) ativos)</span></h2>
        <Despesas
          despesas={estado.despesas} socios={estado.socios}
          onEditar={(id, campo, valor) => editarCampo("despesas", id, campo, valor)}
          onCriar={novaDespesa} onApagar={apagarDespesa}
        />
      </section>
    </div>
  );
}
