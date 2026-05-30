// Reduz e recodifica uma imagem no browser antes do upload:
//  - encolhe para um lado máximo (~1600px) para não enviar megabytes
//  - exporta JPEG (~0.85), o que também converte HEIC do iPhone (que o Safari
//    decodifica) para um formato que aparece em todo o lado.
// Se algo falhar (ex.: HEIC no desktop, que o browser não decodifica), devolve
// o ficheiro original — mais vale enviar grande do que não enviar.

const LADO_MAX = 1600;
const QUALIDADE = 0.85;

export async function prepararImagem(file) {
  if (!file || !file.type?.startsWith("image/")) return file;

  try {
    const bitmap = await carregar(file);
    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * escala);
    const h = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", QUALIDADE));
    if (!blob) return file;
    // se por acaso ficou maior que o original (imagem já pequena), usa o original
    if (blob.size >= file.size && /jpe?g$/i.test(file.type)) return file;
    return new File([blob], "foto.jpg", { type: "image/jpeg" });
  } catch {
    return file; // fallback: envia o original
  }
}

// Carrega o ficheiro como bitmap. Tenta createImageBitmap (rápido) e, se falhar,
// cai para um <img> com object URL.
function carregar(file) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).catch(() => viaImg(file));
  }
  return viaImg(file);
}

function viaImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode falhou")); };
    img.src = url;
  });
}
