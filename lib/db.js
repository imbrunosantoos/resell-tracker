/* =========================================================
   Ligação à base de dados (SQLite via node:sqlite, nativo).
   Sem dependências nativas para compilar — o módulo vem com o Node.
   A BD vive em /data/resell.db (fora do git; cada instalação tem a sua).
   ========================================================= */

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const PASTA_DADOS = process.env.DATA_DIR || path.join(process.cwd(), "data");
const CAMINHO_BD = path.join(PASTA_DADOS, "resell.db");

// Em desenvolvimento o Next recarrega os módulos a cada alteração; guardamos
// a ligação no objeto global para não abrir uma nova a cada hot-reload.
const cache = globalThis.__resellDB ?? (globalThis.__resellDB = {});

function abrir() {
  mkdirSync(PASTA_DADOS, { recursive: true });
  const db = new DatabaseSync(CAMINHO_BD);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrar(db);
  return db;
}

function migrar(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS utilizadores (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      criado_em     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessoes (
      token          TEXT PRIMARY KEY,
      utilizador_id  INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
      criada_em      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config (
      chave TEXT PRIMARY KEY,
      valor TEXT
    );

    -- Sócios com quem fazes pedidos (entidades com nome, não só um número).
    CREATE TABLE IF NOT EXISTS socios (
      id        TEXT PRIMARY KEY,
      nome      TEXT NOT NULL DEFAULT '',
      criado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id           TEXT PRIMARY KEY,
      nome         TEXT NOT NULL DEFAULT 'Pedido sem nome',
      data_compra  TEXT DEFAULT '',
      data_chegada TEXT DEFAULT '',
      taxa_paypal  REAL NOT NULL DEFAULT 0,
      saco         REAL NOT NULL DEFAULT 0,
      socio_id     TEXT REFERENCES socios(id) ON DELETE SET NULL,
      criado_em    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS itens (
      id           TEXT PRIMARY KEY,
      pedido_id    TEXT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      nome         TEXT NOT NULL DEFAULT '',
      categoria    TEXT NOT NULL DEFAULT '',
      preco_compra REAL NOT NULL DEFAULT 0,
      preco_venda  REAL NOT NULL DEFAULT 0,
      data_venda   TEXT NOT NULL DEFAULT '',
      foto         TEXT NOT NULL DEFAULT '',
      notas        TEXT NOT NULL DEFAULT '',
      ordem        INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_itens_pedido ON itens(pedido_id);

    CREATE TABLE IF NOT EXISTS despesas (
      id        TEXT PRIMARY KEY,
      nome      TEXT NOT NULL DEFAULT '',
      valor     REAL NOT NULL DEFAULT 0,
      periodo   TEXT NOT NULL DEFAULT 'mensal',
      criado_em TEXT NOT NULL
    );

    -- Rascunho de encomenda: linhas que se vão juntando até "Criar pedido".
    CREATE TABLE IF NOT EXISTS rascunho (
      id           TEXT PRIMARY KEY,
      nome         TEXT NOT NULL DEFAULT '',
      categoria    TEXT NOT NULL DEFAULT '',
      tamanho      TEXT NOT NULL DEFAULT '',
      quantidade   INTEGER NOT NULL DEFAULT 1,
      preco_compra REAL NOT NULL DEFAULT 0,
      foto         TEXT NOT NULL DEFAULT '',
      ordem        INTEGER NOT NULL DEFAULT 0,
      criado_em    TEXT NOT NULL
    );

    -- Patches de uma camisa (nome + foto). Ligado a um item OU a uma linha do
    -- rascunho; ao criar o pedido, os da linha copiam-se para cada item.
    CREATE TABLE IF NOT EXISTS patches (
      id        TEXT PRIMARY KEY,
      item_id   TEXT REFERENCES itens(id) ON DELETE CASCADE,
      linha_id  TEXT REFERENCES rascunho(id) ON DELETE CASCADE,
      nome      TEXT NOT NULL DEFAULT '',
      foto      TEXT NOT NULL DEFAULT '',
      ordem     INTEGER NOT NULL DEFAULT 0,
      criado_em TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_patches_item ON patches(item_id);
    CREATE INDEX IF NOT EXISTS idx_patches_linha ON patches(linha_id);

    -- Contas/credenciais por plataforma; a password fica cifrada (ver lib/cripto).
    CREATE TABLE IF NOT EXISTS credenciais (
      id                TEXT PRIMARY KEY,
      socio_id          TEXT REFERENCES socios(id) ON DELETE SET NULL,
      plataforma        TEXT NOT NULL DEFAULT '',
      utilizador        TEXT NOT NULL DEFAULT '',
      password_cifrada  TEXT NOT NULL DEFAULT '',
      notas             TEXT NOT NULL DEFAULT '',
      criado_em         TEXT NOT NULL
    );
  `);

  // Colunas acrescentadas depois da v2 — entram só se ainda não existirem,
  // para não rebentar bases de dados que já existiam.
  garantirColuna(db, "pedidos", "socio_id", "TEXT");
  garantirColuna(db, "itens", "foto", "TEXT NOT NULL DEFAULT ''");
  garantirColuna(db, "itens", "notas", "TEXT NOT NULL DEFAULT ''");
  garantirColuna(db, "itens", "tamanho", "TEXT NOT NULL DEFAULT ''");
  // NULL = despesa só tua; senão o sócio com quem a divides (metade cada).
  garantirColuna(db, "despesas", "socio_id", "TEXT");
  // data da despesa (única → o mês em que foi; mensal → a partir de que mês conta).
  garantirColuna(db, "despesas", "data", "TEXT NOT NULL DEFAULT ''");
  // encomendas (pré-pedidos pagos adiantado): um pedido com tipo='encomenda',
  // nome do cliente e data de pagamento. Pedidos antigos ficam tipo='normal'.
  garantirColuna(db, "pedidos", "tipo", "TEXT NOT NULL DEFAULT 'normal'");
  garantirColuna(db, "pedidos", "cliente", "TEXT NOT NULL DEFAULT ''");
  garantirColuna(db, "pedidos", "data_pagamento", "TEXT NOT NULL DEFAULT ''");
  // acerto de contas com sócio, por venda: 1 = já pagaste ao sócio a metade dele
  // do lucro deste item vendido.
  garantirColuna(db, "itens", "acertado", "INTEGER NOT NULL DEFAULT 0");
  // construtor de pedido: cada camisa do rascunho pode ter foto do verso e uma
  // repartição de tamanhos (JSON tamanho→qtd, ex.: {"M":2,"L":1}).
  garantirColuna(db, "rascunho", "foto_verso", "TEXT NOT NULL DEFAULT ''");
  garantirColuna(db, "rascunho", "tamanhos", "TEXT NOT NULL DEFAULT ''");

  // Valores por defeito da configuração (só entram se ainda não existirem).
  const seed = db.prepare(
    "INSERT OR IGNORE INTO config (chave, valor) VALUES (?, ?)"
  );
  seed.run("socios", "2"); // mantido para backups antigos; já não é usado na UI
  seed.run("margemMinima", "20"); // % de margem mínima desejada por peça
  seed.run("diasAlerta", "30"); // a partir de quantos dias parado se acende o alerta
}

// Acrescenta uma coluna a uma tabela só se ela ainda não existir.
function garantirColuna(db, tabela, coluna, definicao) {
  const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all();
  if (!colunas.some((c) => c.name === coluna)) {
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
  }
}

export function getDB() {
  if (!cache.db) cache.db = abrir();
  return cache.db;
}
