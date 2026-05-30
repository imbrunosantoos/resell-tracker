"use client";

import { useEstado } from "@/app/components/contexto";
import Credenciais from "@/app/components/Credenciais";

// Página das contas (logins e passwords por plataforma/sócio, cifradas).
export default function PaginaContas() {
  const { estado, editarCampo, novaCredencial, apagarCredencial } = useEstado();

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>Contas e passwords <span className="conta">— cifradas no servidor</span></h2>
        <Credenciais
          credenciais={estado.credenciais} socios={estado.socios}
          onCriar={novaCredencial}
          onEditar={(id, campo, valor) => editarCampo("credenciais", id, campo, valor)}
          onApagar={apagarCredencial}
        />
      </section>
    </div>
  );
}
