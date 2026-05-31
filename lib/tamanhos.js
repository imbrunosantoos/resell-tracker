// Tamanhos disponíveis conforme o tipo de camisa (pela categoria):
//  - Polo → XS a XXL
//  - Camisa de futebol → S a XL
//  - outras categorias → sem tamanho
const POLO = ["XS", "S", "M", "L", "XL", "XXL"];
const FUTEBOL = ["S", "M", "L", "XL"];

export function tamanhosPara(categoria) {
  const c = String(categoria ?? "").toLowerCase();
  if (c.includes("polo")) return POLO;
  if (c.includes("camisa")) return FUTEBOL; // "Camisa de futebol" (não apanha "Camisola")
  return [];
}
