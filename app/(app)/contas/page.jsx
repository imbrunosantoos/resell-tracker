"use client";

import { useEffect, useState } from "react";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import Credenciais from "@/app/components/Credenciais";
import Skeleton from "@/app/components/Skeleton";

// Página das contas (logins e passwords por plataforma/sócio, cifradas).
// As credenciais carregam-se só aqui (não viajam nas outras páginas).
export default function PaginaContas() {
  const { estado, carregarCredenciais, editarCampo, novaCredencial, apagarCredencial } = useEstado();
  const { t } = useIdioma();
  const [aCarregar, setACarregar] = useState(true);

  useEffect(() => {
    let vivo = true;
    Promise.resolve(carregarCredenciais()).finally(() => { if (vivo) setACarregar(false); });
    return () => { vivo = false; };
  }, [carregarCredenciais]);

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>{t("contas.titulo")} <span className="conta">— {t("contas.sub")}</span></h2>
        {aCarregar ? (
          <Skeleton rows={5} height={44} />
        ) : (
          <Credenciais
            credenciais={estado.credenciais} socios={estado.socios}
            onCriar={novaCredencial}
            onEditar={(id, campo, valor) => editarCampo("credenciais", id, campo, valor)}
            onApagar={apagarCredencial}
          />
        )}
      </section>
    </div>
  );
}
