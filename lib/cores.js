// Uma cor estável por categoria: o mesmo nome dá sempre a mesma cor.
const PALETA = [
  "#3B82F6", "#2DD4BF", "#FBBF24", "#F472B6",
  "#A78BFA", "#4ADE80", "#FB923C", "#FB7185",
];

export function corCategoria(nome) {
  if (!nome) return "#59616F";
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
}
