// Uma cor estável por categoria: o mesmo nome dá sempre a mesma cor.
const PALETA = [
  "#34D399", "#2DD4BF", "#FBBF24", "#F472B6",
  "#A78BFA", "#60A5FA", "#FB923C", "#FB7185",
];

export function corCategoria(nome) {
  if (!nome) return "#59616F";
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
}
