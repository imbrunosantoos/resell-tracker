/* =========================================================
   Fotos dos itens. Guardadas em ficheiro, em data/uploads (fora do git),
   e referidas na BD só pelo nome. Aceita qualquer formato de imagem.
   ========================================================= */

import "server-only";
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, copyFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const PASTA = path.join(process.cwd(), "data", "uploads");

const TIPOS = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".gif": "image/gif", ".heic": "image/heic",
  ".heif": "image/heif", ".avif": "image/avif", ".bmp": "image/bmp",
  ".svg": "image/svg+xml", ".tiff": "image/tiff",
};

// Descobre a extensão a partir do nome original ou, em último caso, do mime.
function extensaoDe(nome, tipo) {
  const ext = path.extname(nome || "").toLowerCase();
  if (ext) return ext;
  const porMime = Object.entries(TIPOS).find(([, m]) => m === tipo);
  return porMime ? porMime[0] : "";
}

export async function guardarFoto(file) {
  mkdirSync(PASTA, { recursive: true });
  const nome = randomUUID() + extensaoDe(file.name, file.type);
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(path.join(PASTA, nome), buffer);
  return nome;
}

export function lerFoto(nome) {
  const seguro = path.basename(nome || ""); // impede travessia de diretórios (../)
  const caminho = path.join(PASTA, seguro);
  if (!seguro || !existsSync(caminho)) return null;
  return {
    buffer: readFileSync(caminho),
    tipo: TIPOS[path.extname(seguro).toLowerCase()] || "application/octet-stream",
  };
}

// Duplica uma foto existente num ficheiro novo e devolve o novo nome. Usado no
// autofill: cada item fica com a SUA cópia (apagar um não afeta o outro).
export function copiarFoto(nome) {
  const origem = path.basename(nome || "");
  const caminhoOrigem = path.join(PASTA, origem);
  if (!origem || !existsSync(caminhoOrigem)) return "";
  mkdirSync(PASTA, { recursive: true });
  const novo = randomUUID() + path.extname(origem);
  copyFileSync(caminhoOrigem, path.join(PASTA, novo));
  return novo;
}

export function apagarFoto(nome) {
  if (!nome) return;
  const caminho = path.join(PASTA, path.basename(nome));
  if (existsSync(caminho)) {
    try { unlinkSync(caminho); } catch { /* já não existe, tudo bem */ }
  }
}
