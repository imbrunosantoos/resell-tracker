"use client";

import { useCallback, useEffect, useState } from "react";
import { useEstado } from "@/app/components/contexto";

// "há X" a partir de uma data ISO (para a última cópia de segurança).
function haQuanto(iso) {
  const seg = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (seg < 60) return "há segundos";
  if (seg < 3600) return `há ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `há ${Math.floor(seg / 3600)} h`;
  return `há ${Math.floor(seg / 86400)} dia(s)`;
}
const quando = (iso) => new Date(iso).toLocaleString("pt-PT");

// Definições: margem mínima, alerta de dias, cópias de segurança e sair.
export default function PaginaDefinicoes() {
  const { estado, editarConfig, exportar, importar, sair, listarBackups, restaurarBackup } = useEstado();

  const [backups, setBackups] = useState([]);
  const refrescar = useCallback(async () => { setBackups(await listarBackups()); }, [listarBackups]);
  useEffect(() => { refrescar(); }, [refrescar]);

  async function criarAgora() {
    await fetch("/api/backup", { method: "POST" });
    refrescar();
  }
  async function restaurar(nome) {
    const ok = await restaurarBackup(nome);
    if (ok) refrescar();
  }

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
        <h2>Cópias de segurança <span className="conta">
          — {backups.length ? `última ${haQuanto(backups[0].data)}` : "automáticas"}</span></h2>
        <p className="dim pequeno" style={{ marginBottom: 12 }}>
          A app guarda uma cópia sozinha a cada alteração (em <code>data/backups/</code>, as últimas 40).
          Podes restaurar qualquer uma aqui. Para guardar fora desta máquina, usa o “Exportar JSON”.
        </p>

        <div className="barra-acoes" style={{ marginBottom: 12 }}>
          <button className="btn" onClick={criarAgora}>Criar cópia agora</button>
          <button className="btn" onClick={() => exportar("json")}>Exportar JSON</button>
          <button className="btn" onClick={() => exportar("csv")}>Exportar CSV</button>
          <label className="btn" style={{ cursor: "pointer" }}>
            Importar
            <input type="file" accept="application/json" hidden
              onChange={(e) => { importar(e.target.files[0]); e.target.value = ""; }} />
          </label>
        </div>

        {backups.length === 0 ? (
          <p className="dim pequeno">Ainda não há cópias. Faz uma alteração ou carrega em “Criar cópia agora”.</p>
        ) : (
          <div className="backups-lista">
            {backups.slice(0, 10).map((b) => (
              <div className="backup-linha" key={b.nome}>
                <span className="backup-data">{quando(b.data)} <span className="dim">· {haQuanto(b.data)}</span></span>
                <button className="btn mini" onClick={() => restaurar(b.nome)}>Restaurar</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bloco">
        <h2>Sessão</h2>
        <button className="btn" onClick={sair}>Terminar sessão</button>
      </section>
    </div>
  );
}
