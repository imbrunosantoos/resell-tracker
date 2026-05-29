/* =========================================================
   Repositório: todas as leituras/escritas na BD passam por aqui.
   A BD usa snake_case; o resto da app fala camelCase. A conversão
   acontece só neste ficheiro para não andar espalhada.
   ========================================================= */

import { randomUUID } from "node:crypto";
import { getDB } from "@/lib/db";

// ---------- Mapeamento ----------
const pedidoParaApi = (r) => ({
  id: r.id,
  nome: r.nome,
  dataCompra: r.data_compra || "",
  dataChegada: r.data_chegada || "",
  taxaPaypal: r.taxa_paypal,
  saco: r.saco,
});

const itemParaApi = (r) => ({
  id: r.id,
  pedidoId: r.pedido_id,
  nome: r.nome,
  categoria: r.categoria,
  precoCompra: r.preco_compra,
  precoVenda: r.preco_venda,
  dataVenda: r.data_venda || "",
});

const despesaParaApi = (r) => ({
  id: r.id,
  nome: r.nome,
  valor: r.valor,
  periodo: r.periodo,
});

// Colunas que cada PATCH pode tocar: campo da API -> coluna da BD + conversão.
const CAMPOS_PEDIDO = {
  nome: { col: "nome", conv: String },
  dataCompra: { col: "data_compra", conv: String },
  dataChegada: { col: "data_chegada", conv: String },
  taxaPaypal: { col: "taxa_paypal", conv: Number },
  saco: { col: "saco", conv: Number },
};

const CAMPOS_ITEM = {
  nome: { col: "nome", conv: String },
  categoria: { col: "categoria", conv: String },
  precoCompra: { col: "preco_compra", conv: Number },
  precoVenda: { col: "preco_venda", conv: Number },
  dataVenda: { col: "data_venda", conv: String },
};

const CAMPOS_DESPESA = {
  nome: { col: "nome", conv: String },
  valor: { col: "valor", conv: Number },
  periodo: { col: "periodo", conv: String },
};

// número tolerante a "12,50"
const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
};

// ---------- Estado completo (o que o browser carrega de uma vez) ----------
export function lerEstado() {
  const db = getDB();
  const pedidos = db.prepare("SELECT * FROM pedidos ORDER BY criado_em DESC").all();
  const itens = db.prepare("SELECT * FROM itens ORDER BY ordem ASC, rowid ASC").all();
  const despesas = db.prepare("SELECT * FROM despesas ORDER BY criado_em ASC").all();
  const config = lerConfig();

  const porPedido = new Map(pedidos.map((p) => [p.id, []]));
  for (const it of itens) porPedido.get(it.pedido_id)?.push(itemParaApi(it));

  return {
    pedidos: pedidos.map((p) => ({ ...pedidoParaApi(p), itens: porPedido.get(p.id) ?? [] })),
    despesas: despesas.map(despesaParaApi),
    config,
  };
}

// ---------- Config ----------
export function lerConfig() {
  const linhas = getDB().prepare("SELECT chave, valor FROM config").all();
  const config = {};
  for (const { chave, valor } of linhas) config[chave] = valor;
  return config;
}

export function gravarConfig(parcial) {
  const stmt = getDB().prepare(
    "INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor"
  );
  for (const [chave, valor] of Object.entries(parcial)) stmt.run(chave, String(valor));
  return lerConfig();
}

// ---------- Pedidos ----------
export function criarPedido(dados = {}) {
  const id = randomUUID();
  getDB()
    .prepare(
      `INSERT INTO pedidos (id, nome, data_compra, data_chegada, taxa_paypal, saco, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      String(dados.nome ?? "").trim() || "Pedido sem nome",
      String(dados.dataCompra ?? ""),
      String(dados.dataChegada ?? ""),
      num(dados.taxaPaypal),
      num(dados.saco),
      new Date().toISOString()
    );
  return { ...pedidoParaApi(getDB().prepare("SELECT * FROM pedidos WHERE id = ?").get(id)), itens: [] };
}

export function atualizarPedido(id, parcial) {
  return atualizarGenerico("pedidos", CAMPOS_PEDIDO, id, parcial);
}

export function apagarPedido(id) {
  getDB().prepare("DELETE FROM pedidos WHERE id = ?").run(id); // itens caem por cascade
}

// ---------- Itens ----------
export function criarItem(pedidoId, dados = {}) {
  const pedido = getDB().prepare("SELECT id FROM pedidos WHERE id = ?").get(pedidoId);
  if (!pedido) throw new Error("Pedido não encontrado.");

  const id = randomUUID();
  const ordem =
    (getDB().prepare("SELECT MAX(ordem) AS m FROM itens WHERE pedido_id = ?").get(pedidoId)?.m ?? 0) + 1;

  getDB()
    .prepare(
      `INSERT INTO itens (id, pedido_id, nome, categoria, preco_compra, preco_venda, data_venda, ordem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id, pedidoId,
      String(dados.nome ?? ""),
      String(dados.categoria ?? ""),
      num(dados.precoCompra),
      num(dados.precoVenda),
      String(dados.dataVenda ?? ""),
      ordem
    );
  return itemParaApi(getDB().prepare("SELECT * FROM itens WHERE id = ?").get(id));
}

export function atualizarItem(id, parcial) {
  return atualizarGenerico("itens", CAMPOS_ITEM, id, parcial, itemParaApi);
}

export function apagarItem(id) {
  getDB().prepare("DELETE FROM itens WHERE id = ?").run(id);
}

// ---------- Despesas ----------
export function criarDespesa(dados = {}) {
  const id = randomUUID();
  getDB()
    .prepare("INSERT INTO despesas (id, nome, valor, periodo, criado_em) VALUES (?, ?, ?, ?, ?)")
    .run(
      id,
      String(dados.nome ?? "").trim() || "Despesa",
      num(dados.valor),
      String(dados.periodo ?? "mensal"),
      new Date().toISOString()
    );
  return despesaParaApi(getDB().prepare("SELECT * FROM despesas WHERE id = ?").get(id));
}

export function atualizarDespesa(id, parcial) {
  return atualizarGenerico("despesas", CAMPOS_DESPESA, id, parcial, despesaParaApi);
}

export function apagarDespesa(id) {
  getDB().prepare("DELETE FROM despesas WHERE id = ?").run(id);
}

// ---------- Importar (substitui tudo) ----------
export function importarEstado(estado) {
  if (!estado || !Array.isArray(estado.pedidos)) throw new Error("Ficheiro inválido.");
  const db = getDB();

  const tx = () => {
    db.exec("DELETE FROM itens; DELETE FROM pedidos; DELETE FROM despesas;");

    for (const p of estado.pedidos) {
      const pedido = criarPedido(p);
      for (const it of p.itens ?? []) criarItem(pedido.id, it);
    }
    for (const d of estado.despesas ?? []) criarDespesa(d);
    if (estado.config) gravarConfig(estado.config);
  };

  db.exec("BEGIN");
  try {
    tx();
    db.exec("COMMIT");
  } catch (erro) {
    db.exec("ROLLBACK");
    throw erro;
  }
}

// ---------- Helper de UPDATE com lista branca de campos ----------
function atualizarGenerico(tabela, campos, id, parcial, mapear) {
  const sets = [];
  const valores = [];
  for (const [campo, valor] of Object.entries(parcial)) {
    const def = campos[campo];
    if (!def) continue; // ignora campos fora da lista branca
    sets.push(`${def.col} = ?`);
    valores.push(def.conv === Number ? num(valor) : def.conv(valor));
  }
  if (sets.length === 0) return null;

  valores.push(id);
  getDB().prepare(`UPDATE ${tabela} SET ${sets.join(", ")} WHERE id = ?`).run(...valores);

  const linha = getDB().prepare(`SELECT * FROM ${tabela} WHERE id = ?`).get(id);
  return mapear ? mapear(linha) : linha;
}
