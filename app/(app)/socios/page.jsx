"use client";

import { useEstado } from "@/app/components/contexto";
import { acertoPorSocio } from "@/lib/calculos";
import Socios from "@/app/components/Socios";

// Aba Sócios: gestão dos sócios + acerto de contas por venda.
export default function PaginaSocios() {
  const { estado, resumo, novoSocio, apagarSocio, editarCampo } = useEstado();
  const acerto = acertoPorSocio(estado);

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>Sócios <span className="conta">— acerto de contas por venda</span></h2>
        <p className="dim pequeno" style={{ marginBottom: 12 }}>
          Cada venda de um pedido com sócio vale metade do lucro para ele. Carrega em “Acertar” quando
          já lhe pagaste — o que falta atualiza-se na hora.
        </p>
        <div className="socios-lista">
          <Socios
            socios={estado.socios} acerto={acerto} meuLucro={resumo.meuLucro}
            onCriar={novoSocio}
            onEditar={(id, campo, valor) => editarCampo("socios", id, campo, valor)}
            onApagar={apagarSocio}
            onAcertar={(itemId, valor) => editarCampo("itens", itemId, "acertado", valor)}
          />
        </div>
      </section>
    </div>
  );
}
