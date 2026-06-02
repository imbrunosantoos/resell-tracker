/* =========================================================
   Cifra das passwords das contas, em repouso (AES-256-GCM).
   A chave é gerada uma vez e guardada em data/.chave — fora do git e
   fora dos backups JSON. Assim, se a BD for parar a outro sítio sem o
   ficheiro da chave, as passwords não se leem. Como a chave é criada
   automaticamente, nunca ficas trancado fora por esqueceres nada.
   ========================================================= */

import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const FICHEIRO_CHAVE = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), ".chave");
let chaveCache = null;

function chave() {
  if (chaveCache) return chaveCache;
  if (existsSync(FICHEIRO_CHAVE)) {
    chaveCache = Buffer.from(readFileSync(FICHEIRO_CHAVE, "utf8").trim(), "hex");
  } else {
    chaveCache = randomBytes(32); // 256 bits
    mkdirSync(path.dirname(FICHEIRO_CHAVE), { recursive: true });
    writeFileSync(FICHEIRO_CHAVE, chaveCache.toString("hex"), { mode: 0o600 });
  }
  return chaveCache;
}

// Devolve "iv:tag:texto-cifrado" em base64. Texto vazio → string vazia.
export function cifrar(texto) {
  if (!texto) return "";
  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", chave(), iv);
  const cifrado = Buffer.concat([cifra.update(String(texto), "utf8"), cifra.final()]);
  const tag = cifra.getAuthTag();
  return [iv, tag, cifrado].map((b) => b.toString("base64")).join(":");
}

export function decifrar(guardado) {
  if (!guardado) return "";
  try {
    const [iv, tag, cifrado] = guardado.split(":").map((p) => Buffer.from(p, "base64"));
    const decifra = createDecipheriv("aes-256-gcm", chave(), iv);
    decifra.setAuthTag(tag);
    return Buffer.concat([decifra.update(cifrado), decifra.final()]).toString("utf8");
  } catch {
    return ""; // chave trocada ou dado corrompido
  }
}
