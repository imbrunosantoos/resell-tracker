"use client";

import { useRef } from "react";

// Lista compacta de patches de uma camisa (nome + foto, opcionais). Usada no
// construtor (linha) e no detalhe (item). O input do nome leva data-patch-id
// para o colar (⌘V) saber a que patch a foto pertence.
export default function Patches({ patches = [], onAdd, onEditarNome, onApagar, onUploadFoto }) {
  return (
    <div className="patches">
      {patches.map((p) => (
        <PatchLinha key={p.id} patch={p} onEditarNome={onEditarNome} onApagar={onApagar} onUploadFoto={onUploadFoto} />
      ))}
      <button type="button" className="patch-add" onClick={onAdd}>+ Patch</button>
    </div>
  );
}

function PatchLinha({ patch, onEditarNome, onApagar, onUploadFoto }) {
  const input = useRef(null);
  const fotoUrl = patch.foto ? `/api/fotos/${patch.foto}` : null;
  return (
    <span className="patch">
      <button type="button" className="patch-foto" onClick={() => input.current?.click()} title={fotoUrl ? "Trocar foto do patch" : "Foto do patch"}>
        {fotoUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={fotoUrl} alt="" />
          : <span className="patch-foto-vazia">+</span>}
      </button>
      <input
        className="patch-nome" placeholder="patch" value={patch.nome}
        data-patch-id={patch.id}
        onChange={(e) => onEditarNome(patch.id, e.target.value)}
      />
      <button type="button" className="patch-x" title="Remover patch" onClick={() => onApagar(patch)}>✕</button>
      <input ref={input} type="file" accept="image/*" hidden
        onChange={(e) => { if (e.target.files[0]) onUploadFoto(patch.id, e.target.files[0]); e.target.value = ""; }} />
    </span>
  );
}
