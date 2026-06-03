"use client";

import { useState } from "react";
import { eur, toNumber } from "@/lib/calculos";
import { corCategoria } from "@/lib/cores";
import { useIdioma } from "./Idioma";

// Campo de nome com autocomplete a partir de itens já existentes (templates).
// Ao escolher uma sugestão, chama onEscolher(origemId) — quem usa decide o que
// fazer (copiar foto/preço/categoria para o item ou para a linha do rascunho).
export default function SugestoesItem({
  value, templates = [], excluirId, onChange, onEscolher,
  placeholder, className = "item-nome",
}) {
  const { t } = useIdioma();
  const [aberto, setAberto] = useState(false);

  const procura = (value || "").trim().toLowerCase();
  const sugestoes = procura
    ? templates
        .filter((tpl) => tpl.origemId !== excluirId && tpl.nome.toLowerCase().includes(procura) && tpl.nome.toLowerCase() !== procura)
        .slice(0, 6)
    : [];

  return (
    <span className="nome-wrap">
      <input
        className={className} placeholder={placeholder ?? t("sug.phItem")} value={value}
        onChange={(e) => { onChange(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
      />
      {aberto && sugestoes.length > 0 && (
        <div className="sugestoes">
          {sugestoes.map((tpl) => (
            <button
              type="button" className="sugestao" key={tpl.origemId}
              onMouseDown={(e) => { e.preventDefault(); onEscolher(tpl.origemId); setAberto(false); }}
            >
              <span className="sugestao-foto" style={tpl.foto ? undefined : { background: corCategoria(tpl.categoria) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {tpl.foto ? <img src={`/api/fotos/${tpl.foto}`} alt="" /> : (tpl.nome[0] || "?")}
              </span>
              <span className="sugestao-txt">
                <span className="sugestao-nome">{tpl.nome}</span>
                <span className="sugestao-sub">{tpl.categoria || t("sug.semCategoria")}{toNumber(tpl.precoCompra) > 0 ? ` · ${eur(toNumber(tpl.precoCompra))}` : ""}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
