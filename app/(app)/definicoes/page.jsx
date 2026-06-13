"use client";

import { useCallback, useEffect, useState } from "react";
import { useEstado } from "@/app/components/contexto";
import { useIdioma } from "@/app/components/Idioma";
import { IDIOMAS } from "@/lib/i18n";

// Definições: margem mínima, alerta de dias, idioma, cópias de segurança e sair.
export default function PaginaDefinicoes() {
  const { estado, editarConfig, exportar, importar, sair, listarBackups, restaurarBackup } = useEstado();
  const { t, idioma, setIdioma, locale } = useIdioma();

  // "há X" a partir de uma data ISO (para a última cópia de segurança).
  const haQuanto = useCallback((iso) => {
    const seg = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
    if (seg < 60) return t("tempo.haSegundos");
    if (seg < 3600) return t("tempo.haMin", { n: Math.floor(seg / 60) });
    if (seg < 86400) return t("tempo.haH", { n: Math.floor(seg / 3600) });
    return t("tempo.haDias", { n: Math.floor(seg / 86400) });
  }, [t]);
  const quando = (iso) => new Date(iso).toLocaleString(locale);

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
        <h2>{t("defin.preferencias")}</h2>
        <div className="defin-lista">
          <label className="defin-linha">
            <span className="defin-rotulo">{t("defin.margemMinima")}</span>
            <input type="number" className="num" min="0" max="99" step="1"
              value={estado.config.margemMinima ?? 20}
              onChange={(e) => editarConfig("margemMinima", e.target.value)} />
          </label>
          <label className="defin-linha">
            <span className="defin-rotulo">{t("defin.alertaStock")}</span>
            <input type="number" className="num" min="1" step="1"
              value={estado.config.diasAlerta ?? 30}
              onChange={(e) => editarConfig("diasAlerta", e.target.value)} />
          </label>
          <label className="defin-linha">
            <span className="defin-rotulo">
              {t("defin.whatsFornecedor")}
              <small className="defin-ajuda">{t("defin.whatsHint")}</small>
            </span>
            <input type="tel" inputMode="tel" placeholder={t("defin.whatsPlaceholder")}
              value={estado.config.fornecedorWhats ?? ""}
              onChange={(e) => editarConfig("fornecedorWhats", e.target.value)} />
          </label>
          <div className="defin-linha">
            <span className="defin-rotulo">{t("defin.idioma")}</span>
            <div className="idioma-seg" role="group" aria-label={t("defin.idioma")}>
              {IDIOMAS.map((i) => (
                <button key={i.codigo} type="button"
                  className={"idioma-seg-btn" + (i.codigo === idioma ? " ativo" : "")}
                  aria-pressed={i.codigo === idioma}
                  onClick={() => setIdioma(i.codigo)}>
                  <span className="bandeira">{i.bandeira}</span> {i.codigo.toUpperCase()}
                  {i.codigo === idioma && <span className="check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bloco">
        <h2>{t("defin.backups")} <span className="conta">
          — {backups.length ? t("defin.ultima", { quando: haQuanto(backups[0].data) }) : t("defin.automaticas")}</span></h2>
        <p className="dim pequeno defin-intro">{t("defin.backupsHint")}</p>

        <div className="barra-acoes defin-acoes">
          <button className="btn" onClick={criarAgora}>{t("defin.criarCopia")}</button>
          <button className="btn" onClick={() => exportar("json")}>{t("defin.exportarJson")}</button>
          <button className="btn" onClick={() => exportar("csv")}>{t("defin.exportarCsv")}</button>
          <label className="btn btn-ficheiro">
            {t("comum.importar")}
            <input type="file" accept="application/json" hidden
              onChange={(e) => { importar(e.target.files[0]); e.target.value = ""; }} />
          </label>
        </div>

        {backups.length === 0 ? (
          <p className="dim pequeno">{t("defin.semCopias")}</p>
        ) : (
          <div className="backups-lista">
            {backups.slice(0, 10).map((b) => (
              <div className="backup-linha" key={b.nome}>
                <span className="backup-data">{quando(b.data)} <span className="dim">· {haQuanto(b.data)}</span></span>
                <button className="btn mini" onClick={() => restaurar(b.nome)}>{t("comum.restaurar")}</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bloco">
        <h2>{t("defin.sessao")}</h2>
        <button className="btn btn-perigo" onClick={sair}>{t("defin.terminarSessao")}</button>
      </section>
    </div>
  );
}
