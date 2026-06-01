"use client";

import { useState } from "react";
import { eur, toNumber } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";

// Campo de nome com autocomplete a partir de itens já existentes (templates).
// Ao escolher uma sugestão, chama onEscolher(origemId) — quem usa decide o que
// fazer (copiar foto/preço/categoria para o item ou para a linha do rascunho).
export default function SugestoesItem({
  value, templates = [], excluirId, onChange, onEscolher,
  placeholder = "ex: Brasil #10", className = "item-nome",
}) {
  const [aberto, setAberto] = useState(false);

  const procura = (value || "").trim().toLowerCase();
  const sugestoes = procura
    ? templates
        .filter((t) => t.origemId !== excluirId && t.nome.toLowerCase().includes(procura) && t.nome.toLowerCase() !== procura)
        .slice(0, 6)
    : [];

  return (
    <span className="nome-wrap">
      <input
        className={className} placeholder={placeholder} value={value}
        onChange={(e) => { onChange(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
      />
      {aberto && sugestoes.length > 0 && (
        <div className="sugestoes">
          {sugestoes.map((t) => (
            <button
              type="button" className="sugestao" key={t.origemId}
              onMouseDown={(e) => { e.preventDefault(); onEscolher(t.origemId); setAberto(false); }}
            >
              <span className="sugestao-foto" style={t.foto ? undefined : { background: corCategoria(t.categoria) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {t.foto ? <img src={`/api/fotos/${t.foto}`} alt="" /> : (t.nome[0] || "?")}
              </span>
              <span className="sugestao-txt">
                <span className="sugestao-nome">{t.nome}</span>
                <span className="sugestao-sub">{t.categoria || "sem categoria"}{toNumber(t.precoCompra) > 0 ? ` · ${eur(toNumber(t.precoCompra))}` : ""}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
