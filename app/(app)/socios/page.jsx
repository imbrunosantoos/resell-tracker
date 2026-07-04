"use client";

import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { acertoPorSocio } from "@/lib/calculos";
import Socios from "@/app/components/Socios";

// Aba Sócios: gestão dos sócios + acerto de contas por venda.
export default function PaginaSocios() {
  const { estado, novoSocio, apagarSocio, editarCampo } = useEstado();
  const { t } = useIdioma();
  const acerto = acertoPorSocio(estado);

  return (
    <div className="pagina">
      <div className="g-main">
        <section className="painel">
          <div className="painel-cab">
            <span className="painel-titulo">{t("nav.socios")}</span>
            <span className="painel-sub">{t("socios.tituloConta")}</span>
          </div>
          <p className="dim pequeno" style={{ marginBottom: 12 }}>{t("socios.hint")}</p>
          <div className="socios-lista">
            <Socios
              socios={estado.socios} acerto={acerto}
              onCriar={novoSocio}
              onEditar={(id, campo, valor) => editarCampo("socios", id, campo, valor)}
              onApagar={apagarSocio}
              onAcertar={(itemId, valor) => editarCampo("itens", itemId, "acertado", valor)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
