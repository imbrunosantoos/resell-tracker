"use client";

import { useEstado } from "@/app/components/contexto";
import GraficoMensal from "@/app/components/GraficoMensal";
import Categorias from "@/app/components/Categorias";
import Socios from "@/app/components/Socios";
import UltimasVendas from "@/app/components/UltimasVendas";

// Página de análise: gráfico mensal, lucro por sócio e categorias.
export default function PaginaLucro() {
  const {
    estado, resumo, categorias, mensal,
    editarCampo, novoSocio, apagarSocio, novoAcerto, apagarAcerto,
  } = useEstado();

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>Sócios <span className="conta">— Lucro e acerto de contas</span></h2>
        <Socios
          socios={estado.socios} porSocio={resumo.porSocio} meuLucro={resumo.meuLucro}
          acertos={estado.acertos ?? []}
          onCriar={novoSocio}
          onEditar={(id, campo, valor) => editarCampo("socios", id, campo, valor)}
          onApagar={apagarSocio}
          onNovoAcerto={novoAcerto}
          onApagarAcerto={apagarAcerto}
        />
      </section>

      <section className="bloco">
        <h2>Lucro por mês</h2>
        <GraficoMensal dados={mensal} />
      </section>

      <section className="bloco">
        <h2>Lucro por categoria</h2>
        <Categorias categorias={categorias} />
      </section>

      <section className="bloco">
        <h2>Últimas vendas</h2>
        <UltimasVendas pedidos={estado.pedidos} socios={estado.socios} />
      </section>
    </div>
  );
}
