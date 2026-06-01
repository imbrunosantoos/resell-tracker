/* =========================================================
   Repositório: todas as leituras/escritas na BD passam por aqui.
   A BD usa snake_case; o resto da app fala camelCase. A conversão
   acontece só neste ficheiro para não andar espalhada.
   ========================================================= */

import { randomUUID } from "node:crypto";
import { getDB } from "@/lib/db";
import { cifrar, decifrar } from "@/lib/cripto";
import { copiarFoto, apagarFoto } from "@/lib/fotos";

// ---------- Mapeamento ----------
const pedidoParaApi = (r) => ({
  id: r.id,
  nome: r.nome,
  dataCompra: r.data_compra || "",
  dataChegada: r.data_chegada || "",
  taxaPaypal: r.taxa_paypal,
  saco: r.saco,
  socioId: r.socio_id || null,
  tipo: r.tipo || "normal",
  cliente: r.cliente || "",
  dataPagamento: r.data_pagamento || "",
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
  acertado: !!r.acertado,
});

const despesaParaApi = (r) => ({
  id: r.id, nome: r.nome, valor: r.valor, periodo: r.periodo, socioId: r.socio_id || null,
  // sem data explícita, herda a data de criação (mês correto, sem migração manual)
  data: r.data || (r.criado_em ? r.criado_em.slice(0, 10) : ""),
});
const socioParaApi = (r) => ({ id: r.id, nome: r.nome });
const patchParaApi = (r) => ({ id: r.id, itemId: r.item_id || null, linhaId: r.linha_id || null, nome: r.nome, foto: r.foto || "" });
const linhaParaApi = (r) => ({
  id: r.id, nome: r.nome, categoria: r.categoria, tamanho: r.tamanho,
  quantidade: r.quantidade, precoCompra: r.preco_compra, foto: r.foto || "",
});
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
  cliente: { col: "cliente", conv: String },
  dataPagamento: { col: "data_pagamento", conv: String },
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
  acertado: { col: "acertado", conv: (v) => (v ? 1 : 0) },
};

const CAMPOS_DESPESA = {
  nome: { col: "nome", conv: String },
  valor: { col: "valor", conv: Number },
  periodo: { col: "periodo", conv: String },
  socioId: { col: "socio_id", conv: (v) => (v ? String(v) : null) },
  data: { col: "data", conv: String },
};

const CAMPOS_SOCIO = { nome: { col: "nome", conv: String } };

const CAMPOS_CREDENCIAL = {
  socioId: { col: "socio_id", conv: (v) => (v ? String(v) : null) },
  plataforma: { col: "plataforma", conv: String },
  utilizador: { col: "utilizador", conv: String },
  notas: { col: "notas", conv: String },
  // password é tratada à parte porque tem de ser cifrada
};

const CAMPOS_LINHA = {
  nome: { col: "nome", conv: String },
  categoria: { col: "categoria", conv: String },
  tamanho: { col: "tamanho", conv: String },
  quantidade: { col: "quantidade", conv: (v) => Math.max(1, Math.round(num(v))) },
  precoCompra: { col: "preco_compra", conv: Number },
  foto: { col: "foto", conv: String },
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
  const rascunho = db.prepare("SELECT * FROM rascunho ORDER BY ordem ASC, rowid ASC").all();
  const patches = db.prepare("SELECT * FROM patches ORDER BY ordem ASC, rowid ASC").all();
  const config = lerConfig();

  // patches agrupados por item e por linha do rascunho
  const patchesItem = new Map(), patchesLinha = new Map();
  for (const p of patches) {
    if (p.item_id) (patchesItem.get(p.item_id) ?? patchesItem.set(p.item_id, []).get(p.item_id)).push(patchParaApi(p));
    else if (p.linha_id) (patchesLinha.get(p.linha_id) ?? patchesLinha.set(p.linha_id, []).get(p.linha_id)).push(patchParaApi(p));
  }

  const porPedido = new Map(pedidos.map((p) => [p.id, []]));
  for (const it of itens) porPedido.get(it.pedido_id)?.push({ ...itemParaApi(it), patches: patchesItem.get(it.id) ?? [] });

  // As credenciais (com passwords) NÃO entram aqui — só se carregam na aba Contas,
  // via lerCredenciais(), para não andar a decifrar/enviar passwords em todas as páginas.
  return {
    pedidos: pedidos.map((p) => ({ ...pedidoParaApi(p), itens: porPedido.get(p.id) ?? [] })),
    despesas: despesas.map(despesaParaApi),
    socios: socios.map(socioParaApi),
    rascunho: rascunho.map((l) => ({ ...linhaParaApi(l), patches: patchesLinha.get(l.id) ?? [] })),
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
      `INSERT INTO pedidos (id, nome, data_compra, data_chegada, taxa_paypal, saco, socio_id, tipo, cliente, data_pagamento, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      String(dados.nome ?? "").trim() || "Pedido sem nome",
      String(dados.dataCompra ?? ""),
      String(dados.dataChegada ?? ""),
      num(dados.taxaPaypal),
      num(dados.saco),
      dados.socioId ? String(dados.socioId) : null,
      dados.tipo === "encomenda" ? "encomenda" : "normal",
      String(dados.cliente ?? ""),
      String(dados.dataPagamento ?? ""),
      new Date().toISOString()
    );
  return { ...pedidoParaApi(getDB().prepare("SELECT * FROM pedidos WHERE id = ?").get(id)), itens: [] };
}

// Encomenda (pré-pedido pago adiantado): um pedido tipo='encomenda' com UM item
// sintético que carrega o custo total e o preço final. taxa/saco=0 → custoReal =
// custo; data de pagamento = data de venda do item → conta logo como vendido.
export function criarEncomenda(dados = {}) {
  const db = getDB();
  const hoje = new Date().toISOString().slice(0, 10);
  const dataPag = String(dados.dataPagamento || "").trim() || hoje; // garante o invariante "vendido"
  const cliente = String(dados.cliente ?? "").trim();

  db.exec("BEGIN");
  try {
    // nome automático: "<Cliente> NN", com NN sequencial por cliente (01, 02, …).
    const n = db
      .prepare("SELECT COUNT(*) AS c FROM pedidos WHERE tipo = 'encomenda' AND LOWER(cliente) = LOWER(?)")
      .get(cliente).c + 1;
    const nn = String(n).padStart(2, "0");
    const nome = cliente ? `${cliente} ${nn}` : `Encomenda ${nn}`;

    const pedido = criarPedido({
      tipo: "encomenda",
      nome,
      cliente,
      socioId: dados.socioId,
      dataPagamento: dataPag,
      dataCompra: String(dados.dataCompra || "").trim() || dataPag,
      taxaPaypal: 0,
      saco: 0,
    });
    const item = criarItem(pedido.id, {
      nome,
      categoria: "Camisa de futebol",
      precoCompra: dados.custoTotal,
      precoVenda: dados.precoFinal,
      dataVenda: dataPag,
    });
    db.exec("COMMIT");
    return { ...pedido, itens: [item] };
  } catch (erro) {
    db.exec("ROLLBACK");
    throw erro;
  }
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
    .prepare("INSERT INTO despesas (id, nome, valor, periodo, socio_id, data, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(
      id,
      String(dados.nome ?? "").trim() || "Despesa",
      num(dados.valor),
      String(dados.periodo ?? "mensal"),
      dados.socioId ? String(dados.socioId) : null,
      String(dados.data || new Date().toISOString().slice(0, 10)),
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

// ---------- Rascunho de encomenda ----------
export function criarLinha(dados = {}) {
  const id = randomUUID();
  const ordem = (getDB().prepare("SELECT MAX(ordem) AS m FROM rascunho").get()?.m ?? 0) + 1;
  getDB()
    .prepare(
      `INSERT INTO rascunho (id, nome, categoria, tamanho, quantidade, preco_compra, foto, ordem, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      String(dados.nome ?? ""),
      String(dados.categoria ?? ""),
      String(dados.tamanho ?? ""),
      Math.max(1, Math.round(num(dados.quantidade)) || 1),
      num(dados.precoCompra),
      String(dados.foto ?? ""),
      ordem,
      new Date().toISOString()
    );
  return linhaParaApi(getDB().prepare("SELECT * FROM rascunho WHERE id = ?").get(id));
}

export function atualizarLinha(id, parcial) {
  return atualizarGenerico("rascunho", CAMPOS_LINHA, id, parcial, linhaParaApi);
}

export function apagarLinha(id) {
  const linha = getDB().prepare("SELECT foto FROM rascunho WHERE id = ?").get(id);
  if (linha?.foto) apagarFoto(linha.foto);
  getDB().prepare("DELETE FROM rascunho WHERE id = ?").run(id);
}

export function lerLinha(id) {
  const r = getDB().prepare("SELECT * FROM rascunho WHERE id = ?").get(id);
  return r ? linhaParaApi(r) : null;
}

// Autofill numa linha do rascunho a partir de um item existente.
export function aplicarTemplateLinha(linhaId, origemId) {
  const db = getDB();
  const origem = db.prepare("SELECT * FROM itens WHERE id = ?").get(origemId);
  const alvo = db.prepare("SELECT foto FROM rascunho WHERE id = ?").get(linhaId);
  if (!origem || !alvo) throw new Error("Linha ou item não encontrado.");
  if (alvo.foto) apagarFoto(alvo.foto); // substitui a foto anterior da linha
  const foto = origem.foto ? copiarFoto(origem.foto) : "";
  db.prepare("UPDATE rascunho SET nome = ?, categoria = ?, preco_compra = ?, foto = ? WHERE id = ?")
    .run(origem.nome, origem.categoria, origem.preco_compra, foto, linhaId);
  return linhaParaApi(db.prepare("SELECT * FROM rascunho WHERE id = ?").get(linhaId));
}

// "Criar pedido": cria o pedido + N itens por linha (quantidade), cada item com a
// sua cópia da foto, e limpa o rascunho. Tudo numa transação.
export function finalizarRascunho(dadosPedido = {}) {
  const db = getDB();
  const linhas = db.prepare("SELECT * FROM rascunho ORDER BY ordem ASC, rowid ASC").all();
  if (linhas.length === 0) throw new Error("O rascunho está vazio.");

  db.exec("BEGIN");
  try {
    const pedido = criarPedido(dadosPedido);
    for (const linha of linhas) {
      const linhaPatches = db.prepare("SELECT * FROM patches WHERE linha_id = ? ORDER BY ordem ASC").all(linha.id);
      const qtd = Math.max(1, linha.quantidade || 1);
      for (let i = 0; i < qtd; i++) {
        const item = criarItem(pedido.id, {
          nome: linha.nome,
          categoria: linha.categoria,
          tamanho: linha.tamanho,
          precoCompra: linha.preco_compra,
          foto: linha.foto ? copiarFoto(linha.foto) : "",
        });
        // cada item fica com a sua cópia dos patches da linha
        for (const pt of linhaPatches) {
          criarPatch({ itemId: item.id, nome: pt.nome, foto: pt.foto ? copiarFoto(pt.foto) : "" });
        }
      }
      if (linha.foto) apagarFoto(linha.foto); // fotos originais da linha já não são precisas
      for (const pt of linhaPatches) if (pt.foto) apagarFoto(pt.foto);
    }
    db.exec("DELETE FROM rascunho"); // patches da linha caem por cascade
    db.exec("COMMIT");
    // devolve o pedido já com os itens (e os seus patches)
    const itens = db.prepare("SELECT * FROM itens WHERE pedido_id = ? ORDER BY ordem ASC").all(pedido.id);
    return {
      ...pedido,
      itens: itens.map((it) => ({ ...itemParaApi(it), patches: lerPatchesDe("item_id", it.id) })),
    };
  } catch (erro) {
    db.exec("ROLLBACK");
    throw erro;
  }
}

// ---------- Patches (de um item ou de uma linha do rascunho) ----------
function lerPatchesDe(coluna, id) {
  return getDB().prepare(`SELECT * FROM patches WHERE ${coluna} = ? ORDER BY ordem ASC, rowid ASC`).all(id).map(patchParaApi);
}

export function lerPatch(id) {
  const r = getDB().prepare("SELECT * FROM patches WHERE id = ?").get(id);
  return r ? patchParaApi(r) : null;
}

export function criarPatch(dados = {}) {
  const id = randomUUID();
  const onde = dados.itemId ? "item_id" : "linha_id";
  const pai = dados.itemId || dados.linhaId || null;
  const ordem = (getDB().prepare(`SELECT MAX(ordem) AS m FROM patches WHERE ${onde} = ?`).get(pai)?.m ?? 0) + 1;
  getDB()
    .prepare("INSERT INTO patches (id, item_id, linha_id, nome, foto, ordem, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(
      id,
      dados.itemId ? String(dados.itemId) : null,
      dados.linhaId ? String(dados.linhaId) : null,
      String(dados.nome ?? ""),
      String(dados.foto ?? ""),
      ordem,
      new Date().toISOString()
    );
  return patchParaApi(getDB().prepare("SELECT * FROM patches WHERE id = ?").get(id));
}

export function atualizarPatch(id, parcial) {
  if (Object.prototype.hasOwnProperty.call(parcial, "nome")) {
    getDB().prepare("UPDATE patches SET nome = ? WHERE id = ?").run(String(parcial.nome ?? ""), id);
  }
  if (Object.prototype.hasOwnProperty.call(parcial, "foto")) {
    getDB().prepare("UPDATE patches SET foto = ? WHERE id = ?").run(String(parcial.foto ?? ""), id);
  }
  return lerPatch(id);
}

export function apagarPatch(id) {
  const p = getDB().prepare("SELECT foto FROM patches WHERE id = ?").get(id);
  if (p?.foto) apagarFoto(p.foto);
  getDB().prepare("DELETE FROM patches WHERE id = ?").run(id);
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
      for (const it of p.itens ?? []) {
        const item = criarItem(pedido.id, it);
        // recriar os patches do item (a foto já existe no disco — referência igual)
        for (const pt of it.patches ?? []) criarPatch({ itemId: item.id, nome: pt.nome, foto: pt.foto });
      }
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
