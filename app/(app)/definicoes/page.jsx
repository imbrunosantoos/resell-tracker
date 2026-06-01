"use client";

import { useEstado } from "@/app/components/contexto";

// Definições: margem mínima, alerta de dias, backup e sair.
export default function PaginaDefinicoes() {
  const { estado, editarConfig, exportar, importar, sair } = useEstado();

  return (
    <div className="pagina">
      <section className="bloco">
        <h2>Preferências</h2>
        <div className="form-novo">
          <label className="campo">
            <span>Margem mínima (%)</span>
            <input type="number" className="num" min="0" max="99" step="1"
              value={estado.config.margemMinima ?? 20}
              onChange={(e) => editarConfig("margemMinima", e.target.value)} />
          </label>
          <label className="campo">
            <span>Alerta de stock parado (dias)</span>
            <input type="number" className="num" min="1" step="1"
              value={estado.config.diasAlerta ?? 30}
              onChange={(e) => editarConfig("diasAlerta", e.target.value)} />
          </label>
          <label className="campo">
            <span>WhatsApp do fornecedor</span>
            <input type="tel" inputMode="tel" placeholder="ex: 351912345678"
              value={estado.config.fornecedorWhats ?? ""}
              onChange={(e) => editarConfig("fornecedorWhats", e.target.value)} />
          </label>
        </div>
        <p className="dim pequeno" style={{ marginTop: 8 }}>
          Número com indicativo do país, só dígitos (ex.: <code>351912345678</code>). Usado no botão
          “Criar pedido” para abrir a conversa do fornecedor com a lista.
        </p>
      </section>

      <section className="bloco">
        <h2>Backup</h2>
        <div className="barra-acoes">
          <button className="btn" onClick={() => exportar("json")}>Exportar JSON</button>
          <button className="btn" onClick={() => exportar("csv")}>Exportar CSV</button>
          <label className="btn" style={{ cursor: "pointer" }}>
            Importar
            <input type="file" accept="application/json" hidden
              onChange={(e) => { importar(e.target.files[0]); e.target.value = ""; }} />
          </label>
        </div>
        <p className="dim pequeno" style={{ marginTop: 10 }}>
          O JSON guarda pedidos, itens, sócios e despesas (não as passwords das contas).
          Para backup completo, copia a pasta <code>data/</code>.
        </p>
      </section>

      <section className="bloco">
        <h2>Sessão</h2>
        <button className="btn" onClick={sair}>Terminar sessão</button>
      </section>
    </div>
  );
}
