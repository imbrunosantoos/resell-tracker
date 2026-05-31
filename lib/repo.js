/* =========================================================
   Repositório: todas as leituras/escritas na BD passam por aqui.
   A BD usa snake_case; o resto da app fala camelCase. A conversão
   acontece só neste ficheiro para não andar espalhada.
   ========================================================= */

import { randomUUID } from "node:crypto";
import { getDB } from "@/lib/db";
import { cifrar, decifrar } from "@/lib/cripto";
import { copiarFoto } from "@/lib/fotos";

// ---------- Mapeamento ----------
const pedidoParaApi = (r) => ({
  id: r.id,
  nome: r.nome,
  dataCompra: r.data_compra || "",
  dataChegada: r.data_chegada || "",
  taxaPaypal: r.taxa_paypal,
  saco: r.saco,
  socioId: r.socio_id || null,
});

const itemParaApi = (r) => ({
  id: r.id,
  pedidoId: r.pedido_id,
  nome: r.nome,
  categoria: r.categoria,
  precoCompra: r.preco_compra,
  precoVenda: r.preco_venda,
  dataVenda: r.data_venda || "",
  foto: r.foto || "",
  notas: r.notas || "",
  tamanho: r.tamanho || "",
});

const despesaParaApi = (r) => ({
  id: r.id, nome: r.nome, valor: r.valor, periodo: r.periodo, socioId: r.socio_id || null,
});
const socioParaApi = (r) => ({ id: r.id, nome: r.nome });
const credencialParaApi = (r) => ({
  id: r.id,
  socioId: r.socio_id || null,
  plataforma: r.plataforma,
  utilizador: r.utilizador,
  password: decifrar(r.password_cifrada),
  notas: r.notas,
});

// Colunas que cada PATCH pode tocar: campo da API -> coluna da BD + conversão.
const CAMPOS_PEDIDO = {
  nome: { col: "nome", conv: String },
  dataCompra: { col: "data_compra", conv: String },
  dataChegada: { col: "data_chegada", conv: String },
  taxaPaypal: { col: "taxa_paypal", conv: Number },
  saco: { col: "saco", conv: Number },
  socioId: { col: "socio_id", conv: (v) => (v ? String(v) : null) },
};

const CAMPOS_ITEM = {
  nome: { col: "nome", conv: String },
  categoria: { col: "categoria", conv: String },
  precoCompra: { col: "preco_compra", conv: Number },
  precoVenda: { col: "preco_venda", conv: Number },
  dataVenda: { col: "data_venda", conv: String },
  foto: { col: "foto", conv: String },
  notas: { col: "notas", conv: String },
  tamanho: { col: "tamanho", conv: String },
};

const CAMPOS_DESPESA = {
  nome: { col: "nome", conv: String },
  valor: { col: "valor", conv: Number },
  periodo: { col: "periodo", conv: String },
  socioId: { col: "socio_id", conv: (v) => (v ? String(v) : null) },
};

const CAMPOS_SOCIO = { nome: { col: "nome", conv: String } };

const CAMPOS_CREDENCIAL = {
  socioId: { col: "socio_id", conv: (v) => (v ? String(v) : null) },
  plataforma: { col: "plataforma", conv: String },
  utilizador: { col: "utilizador", conv: String },
  notas: { col: "notas", conv: String },
  // password é tratada à parte porque tem de ser cifrada
};

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
  const socios = db.prepare("SELECT * FROM socios ORDER BY nome ASC").all();
  const config = lerConfig();

  const porPedido = new Map(pedidos.map((p) => [p.id, []]));
  for (const it of itens) porPedido.get(it.pedido_id)?.push(itemParaApi(it));

  // As credenciais (com passwords) NÃO entram aqui — só se carregam na aba Contas,
  // via lerCredenciais(), para não andar a decifrar/enviar passwords em todas as páginas.
  return {
    pedidos: pedidos.map((p) => ({ ...pedidoParaApi(p), itens: porPedido.get(p.id) ?? [] })),
    despesas: despesas.map(despesaParaApi),
    socios: socios.map(socioParaApi),
    config,
  };
}

// Lê as credenciais (com as passwords decifradas). Usado só na aba Contas.
export function lerCredenciais() {
  return getDB()
    .prepare("SELECT * FROM credenciais ORDER BY plataforma ASC")
    .all()
    .map(credencialParaApi);
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
      `INSERT INTO pedidos (id, nome, data_compra, data_chegada, taxa_paypal, saco, socio_id, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      String(dados.nome ?? "").trim() || "Pedido sem nome",
      String(dados.dataCompra ?? ""),
      String(dados.dataChegada ?? ""),
      num(dados.taxaPaypal),
      num(dados.saco),
      dados.socioId ? String(dados.socioId) : null,
      new Date().toISOString()
    );
  return { ...pedidoParaApi(getDB().prepare("SELECT * FROM pedidos WHERE id = ?").get(id)), itens: [] };
}

export function atualizarPedido(id, parcial) {
  return atualizarGenerico("pedidos", CAMPOS_PEDIDO, id, parcial, pedidoParaApi);
}

export function apagarPedido(id) {
  getDB().prepare("DELETE FROM pedidos WHERE id = ?").run(id);
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
      `INSERT INTO itens (id, pedido_id, nome, categoria, preco_compra, preco_venda, data_venda, foto, notas, tamanho, ordem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id, pedidoId,
      String(dados.nome ?? ""),
      String(dados.categoria ?? ""),
      num(dados.precoCompra),
      num(dados.precoVenda),
      String(dados.dataVenda ?? ""),
      String(dados.foto ?? ""),
      String(dados.notas ?? ""),
      String(dados.tamanho ?? ""),
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

// Muda a categoria de vários itens de uma vez (seleção em massa).
export function atualizarCategoriaItens(ids, categoria) {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  const stmt = getDB().prepare("UPDATE itens SET categoria = ? WHERE id = ?");
  const cat = String(categoria ?? "");
  let n = 0;
  for (const id of ids) n += stmt.run(cat, id).changes;
  return n;
}

// Autofill: copia de um item de origem o nome, categoria e preço de compra para
// o item alvo; se a origem tiver foto, faz uma cópia do ficheiro para o alvo.
export function aplicarTemplate(itemId, origemId) {
  const db = getDB();
  const origem = db.prepare("SELECT * FROM itens WHERE id = ?").get(origemId);
  const alvo = db.prepare("SELECT id FROM itens WHERE id = ?").get(itemId);
  if (!origem || !alvo) throw new Error("Item não encontrado.");

  const foto = origem.foto ? copiarFoto(origem.foto) : "";
  db.prepare(
    "UPDATE itens SET nome = ?, categoria = ?, preco_compra = ?, foto = ? WHERE id = ?"
  ).run(origem.nome, origem.categoria, origem.preco_compra, foto, itemId);

  return itemParaApi(db.prepare("SELECT * FROM itens WHERE id = ?").get(itemId));
}

export function lerItem(id) {
  const r = getDB().prepare("SELECT * FROM itens WHERE id = ?").get(id);
  return r ? itemParaApi(r) : null;
}

// ---------- Despesas ----------
export function criarDespesa(dados = {}) {
  const id = randomUUID();
  getDB()
    .prepare("INSERT INTO despesas (id, nome, valor, periodo, socio_id, criado_em) VALUES (?, ?, ?, ?, ?, ?)")
    .run(
      id,
      String(dados.nome ?? "").trim() || "Despesa",
      num(dados.valor),
      String(dados.periodo ?? "mensal"),
      dados.socioId ? String(dados.socioId) : null,
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

// ---------- Sócios ----------
export function criarSocio(dados = {}) {
  const id = randomUUID();
  getDB()
    .prepare("INSERT INTO socios (id, nome, criado_em) VALUES (?, ?, ?)")
    .run(id, String(dados.nome ?? "").trim() || "Sócio", new Date().toISOString());
  return socioParaApi(getDB().prepare("SELECT * FROM socios WHERE id = ?").get(id));
}

export function atualizarSocio(id, parcial) {
  return atualizarGenerico("socios", CAMPOS_SOCIO, id, parcial, socioParaApi);
}

export function apagarSocio(id) {
  getDB().prepare("DELETE FROM socios WHERE id = ?").run(id); // pedidos/credenciais ficam com socio_id NULL
}

// ---------- Credenciais (passwords cifradas) ----------
export function criarCredencial(dados = {}) {
  const id = randomUUID();
  getDB()
    .prepare(
      `INSERT INTO credenciais (id, socio_id, plataforma, utilizador, password_cifrada, notas, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      dados.socioId ? String(dados.socioId) : null,
      String(dados.plataforma ?? ""),
      String(dados.utilizador ?? ""),
      cifrar(dados.password ?? ""),
      String(dados.notas ?? ""),
      new Date().toISOString()
    );
  return credencialParaApi(getDB().prepare("SELECT * FROM credenciais WHERE id = ?").get(id));
}

export function atualizarCredencial(id, parcial) {
  // A password, se vier, é cifrada antes de gravar.
  if (Object.prototype.hasOwnProperty.call(parcial, "password")) {
    getDB()
      .prepare("UPDATE credenciais SET password_cifrada = ? WHERE id = ?")
      .run(cifrar(parcial.password ?? ""), id);
  }
  return atualizarGenerico("credenciais", CAMPOS_CREDENCIAL, id, parcial, credencialParaApi);
}

export function apagarCredencial(id) {
  getDB().prepare("DELETE FROM credenciais WHERE id = ?").run(id);
}

// ---------- Importar (substitui os dados do negócio) ----------
export function importarEstado(estado) {
  if (!estado || !Array.isArray(estado.pedidos)) throw new Error("Ficheiro inválido.");
  const db = getDB();

  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM itens; DELETE FROM pedidos; DELETE FROM despesas; DELETE FROM socios;");

    for (const s of estado.socios ?? []) {
      db.prepare("INSERT INTO socios (id, nome, criado_em) VALUES (?, ?, ?)")
        .run(s.id ?? randomUUID(), String(s.nome ?? ""), new Date().toISOString());
    }
    for (const p of estado.pedidos) {
      const pedido = criarPedido(p);
      for (const it of p.itens ?? []) criarItem(pedido.id, it);
    }
    for (const d of estado.despesas ?? []) criarDespesa(d);
    if (estado.config) gravarConfig(estado.config);
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
  if (sets.length > 0) {
    valores.push(id);
    getDB().prepare(`UPDATE ${tabela} SET ${sets.join(", ")} WHERE id = ?`).run(...valores);
  }

  const linha = getDB().prepare(`SELECT * FROM ${tabela} WHERE id = ?`).get(id);
  return mapear ? mapear(linha) : linha;
}
