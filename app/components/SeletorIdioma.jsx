"use client";

import { useEffect, useRef, useState } from "react";
import { useIdioma } from "./Idioma";
import { IDIOMAS } from "@/lib/i18n";

// Seletor de idioma: botão com a bandeira atual que abre um mini-menu PT/EN/ES.
// Fecha ao escolher, ao clicar fora ou no Escape. Vive na sidebar (desktop) e
// no cabeçalho móvel.
export default function SeletorIdioma() {
  const { t, idioma, setIdioma } = useIdioma();
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  const atual = IDIOMAS.find((i) => i.codigo === idioma) ?? IDIOMAS[0];

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    const esc = (e) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);

  return (
    <div className="nav-idioma" ref={ref}>
      <button type="button" className="nav-idioma-btn" aria-label={t("idioma.label")}
        aria-haspopup="listbox" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span className="bandeira">{atual.bandeira}</span>
        <span className="seta">▾</span>
      </button>
      {aberto && (
        <ul className="nav-idioma-menu" role="listbox">
          {IDIOMAS.map((i) => (
            <li key={i.codigo}>
              <button type="button" role="option" aria-selected={i.codigo === idioma}
                className={"nav-idioma-item" + (i.codigo === idioma ? " ativo" : "")}
                onClick={() => { setIdioma(i.codigo); setAberto(false); }}>
                <span className="bandeira">{i.bandeira}</span> {i.nome}
                {i.codigo === idioma && <span className="check">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
