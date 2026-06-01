"use client";

import { useState } from "react";

// Input de texto com autocomplete a partir de uma lista simples de strings
// (ex.: nomes de clientes já usados). Ao clicar numa sugestão, faz onChange(opcao).
export default function SugestoesTexto({
  value, opcoes = [], onChange, placeholder = "", className = "", required = false,
}) {
  const [aberto, setAberto] = useState(false);

  const procura = (value || "").trim().toLowerCase();
  const sugestoes = procura
    ? opcoes.filter((o) => o.toLowerCase().includes(procura) && o.toLowerCase() !== procura).slice(0, 6)
    : [];

  return (
    <span className="nome-wrap">
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => { onChange(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
      />
      {aberto && sugestoes.length > 0 && (
        <div className="sugestoes">
          {sugestoes.map((o) => (
            <button
              type="button" className="sugestao sugestao-texto" key={o}
              onMouseDown={(e) => { e.preventDefault(); onChange(o); setAberto(false); }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
