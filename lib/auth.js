/* =========================================================
   Autenticação simples: cada utilizador tem login próprio, mas
   partilham todos os mesmos dados do negócio (tu e o teu sócio a
   meter vendas na mesma operação). Sessão guardada numa tabela e
   referida por um cookie httpOnly.
   ========================================================= */

import "server-only";
import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { getDB } from "@/lib/db";

const COOKIE = "resell_sessao";
const TRINTA_DIAS = 60 * 60 * 24 * 30;

export async function registar(nome, password) {
  nome = String(nome ?? "").trim();
  password = String(password ?? "");
  if (nome.length < 2) throw new Error("Nome de utilizador demasiado curto.");
  if (password.length < 4) throw new Error("A password tem de ter pelo menos 4 caracteres.");

  const db = getDB();
  const existe = db.prepare("SELECT id FROM utilizadores WHERE nome = ?").get(nome);
  if (existe) throw new Error("Já existe um utilizador com esse nome.");

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO utilizadores (nome, password_hash, criado_em) VALUES (?, ?, ?)")
    .run(nome, hash, new Date().toISOString());

  await criarSessao(Number(info.lastInsertRowid));
  return { id: Number(info.lastInsertRowid), nome };
}

export async function entrar(nome, password) {
  nome = String(nome ?? "").trim();
  const db = getDB();
  const u = db.prepare("SELECT * FROM utilizadores WHERE nome = ?").get(nome);
  if (!u || !bcrypt.compareSync(String(password ?? ""), u.password_hash)) {
    throw new Error("Nome ou password errados.");
  }
  await criarSessao(u.id);
  return { id: u.id, nome: u.nome };
}

async function criarSessao(utilizadorId) {
  const token = randomBytes(32).toString("hex");
  getDB()
    .prepare("INSERT INTO sessoes (token, utilizador_id, criada_em) VALUES (?, ?, ?)")
    .run(token, utilizadorId, new Date().toISOString());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TRINTA_DIAS,
  });
}

export async function sair() {
  const token = cookies().get(COOKIE)?.value;
  if (token) getDB().prepare("DELETE FROM sessoes WHERE token = ?").run(token);
  cookies().delete(COOKIE);
}

// Devolve o utilizador da sessão atual, ou null se não houver sessão válida.
export function utilizadorAtual() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const linha = getDB()
    .prepare(
      `SELECT u.id, u.nome FROM sessoes s
       JOIN utilizadores u ON u.id = s.utilizador_id
       WHERE s.token = ?`
    )
    .get(token);
  // O node:sqlite devolve linhas com prototype null; um Server Component só
  // pode passar objetos simples a Client Components, por isso normalizamos.
  return linha ? { id: Number(linha.id), nome: linha.nome } : null;
}

// Há pelo menos uma conta criada? (decide entre mostrar "entrar" ou "criar conta")
export function existemContas() {
  return Boolean(getDB().prepare("SELECT 1 FROM utilizadores LIMIT 1").get());
}

export { randomUUID };
