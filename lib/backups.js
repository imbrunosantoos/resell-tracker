/* =========================================================
   Cópias de segurança automáticas, em disco. A cada alteração o cliente pede
   um snapshot; guardamos um JSON com data/hora em data/backups/ e mantemos
   só os mais recentes. Dá para listar e restaurar de dentro da app.
   As passwords das contas ficam de fora (como no export).
   ========================================================= */

import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { lerEstado, importarEstado } from "@/lib/repo";

const PASTA = path.join(process.cwd(), "data", "backups");
const MAX = 40; // nº de cópias a manter

function garantirPasta() {
  mkdirSync(PASTA, { recursive: true });
}

// Guarda um snapshot do estado atual (sem credenciais) e poda os mais antigos.
export function guardarSnapshot() {
  garantirPasta();
  const { credenciais, ...dados } = lerEstado();
  const nome = new Date().toISOString().replace(/[:.]/g, "-") + ".json";
  writeFileSync(path.join(PASTA, nome), JSON.stringify(dados));
  podar();
  return { nome };
}

function podar() {
  const ficheiros = readdirSync(PASTA).filter((f) => f.endsWith(".json")).sort(); // nome ISO → ordem cronológica
  for (const f of ficheiros.slice(0, Math.max(0, ficheiros.length - MAX))) {
    try { unlinkSync(path.join(PASTA, f)); } catch { /* ignora */ }
  }
}

// Lista as cópias, da mais recente para a mais antiga.
export function listarBackups() {
  garantirPasta();
  return readdirSync(PASTA)
    .filter((f) => f.endsWith(".json"))
    .map((nome) => {
      const s = statSync(path.join(PASTA, nome));
      return { nome, data: s.mtime.toISOString(), tamanho: s.size };
    })
    .sort((a, b) => (a.nome < b.nome ? 1 : -1));
}

// Restaura uma cópia (substitui pedidos/itens/sócios/despesas/acertos).
export function restaurarBackup(nome) {
  // só um basename .json dentro da pasta — sem path traversal
  const base = path.basename(String(nome || ""));
  if (!base.endsWith(".json") || base !== nome) throw new Error("Cópia inválida.");
  const caminho = path.join(PASTA, base);
  if (path.dirname(caminho) !== PASTA) throw new Error("Cópia inválida.");
  const dados = JSON.parse(readFileSync(caminho, "utf8"));
  return importarEstado(dados);
}
