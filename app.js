/* =========================================================
   ReSell — tracker de revenda
   JavaScript puro, sem dependências.
   Modelo: cada PEDIDO tem vários ITENS. O custo real de um item
   é o que pagaste por ele + a taxa de PayPal diluída pelos itens
   do pedido + o saco. A partir daí calculam-se margem, % e dias.
   Tudo fica guardado no localStorage do browser.
   ========================================================= */

// ---------- Estado & persistência ----------
const STORAGE_KEY = "resell-tracker-v1";

const state = {
  pedidos: [],
  socios: 2, // por quantas pessoas se divide o lucro
};

function carregar() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) Object.assign(state, JSON.parse(guardado));
  } catch (erro) {
    console.warn("Não foi possível ler os dados guardados:", erro);
  }
}

function guardar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- Utilitários ----------
const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const setText = (id, valor) => {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// aceita "12,50" ou "12.50"; devolve sempre número
const toNumber = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
};
const eur = (n) => "€" + (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");

const diasEntre = (de, ate) => {
  if (!de || !ate) return null;
  const d = Math.round((Date.parse(ate) - Date.parse(de)) / 86_400_000);
  return Number.isNaN(d) ? null : d;
};

const escapar = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Uma cor estável por categoria: o mesmo nome dá sempre a mesma cor.
const PALETA = ["#3B82F6", "#2DD4BF", "#FBBF24", "#F472B6", "#A78BFA", "#4ADE80", "#FB923C", "#FB7185"];
function corCategoria(nome) {
  if (!nome) return "#59616F";
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETA[h % PALETA.length];
}

// ---------- Acesso ao estado ----------
const acharPedido = (id) => state.pedidos.find((p) => p.id === id);
const acharItem = (pedido, id) => pedido.itens.find((i) => i.id === id);

// ---------- Cálculos ----------
function taxaPorItem(pedido) {
  const n = pedido.itens.length;
  return n > 0 ? toNumber(pedido.taxaPaypal) / n : 0;
}

function custoReal(pedido, item) {
  return toNumber(item.precoCompra) + taxaPorItem(pedido) + toNumber(pedido.saco);
}

const estaVendido = (item) => toNumber(item.precoVenda) > 0 && Boolean(item.dataVenda);

function margem(pedido, item) {
  return estaVendido(item) ? toNumber(item.precoVenda) - custoReal(pedido, item) : null;
}

function diasParaVender(pedido, item) {
  if (!estaVendido(item)) return null;
  return diasEntre(pedido.dataChegada || pedido.dataCompra, item.dataVenda);
}

function resumoPedido(pedido) {
  let investido = 0, receita = 0, lucro = 0, vendidos = 0, somaDias = 0, comDias = 0;

  for (const item of pedido.itens) {
    investido += custoReal(pedido, item);
    if (!estaVendido(item)) continue;

    receita += toNumber(item.precoVenda);
    lucro += margem(pedido, item);
    vendidos++;

    const dias = diasParaVender(pedido, item);
    if (dias !== null) { somaDias += dias; comDias++; }
  }

  return {
    investido, receita, lucro, vendidos,
    total: pedido.itens.length,
    margemPct: receita > 0 ? Math.round((lucro / receita) * 100) : null,
    diasMedios: comDias > 0 ? Math.round(somaDias / comDias) : null,
  };
}

function resumoGlobal() {
  let investido = 0, receita = 0, lucro = 0, stock = 0;
  const categorias = {}; // nome -> { lucro, vendidos }

  for (const pedido of state.pedidos) {
    for (const item of pedido.itens) {
      const custo = custoReal(pedido, item);
      investido += custo;

      const cat = item.categoria?.trim() || "Sem categoria";
      categorias[cat] ??= { lucro: 0, vendidos: 0 };

      if (estaVendido(item)) {
        const m = margem(pedido, item);
        receita += toNumber(item.precoVenda);
        lucro += m;
        categorias[cat].lucro += m;
        categorias[cat].vendidos++;
      } else {
        stock += custo;
      }
    }
  }

  const socios = Math.max(1, toNumber(state.socios) || 1);
  return { investido, receita, lucro, stock, porPessoa: lucro / socios, categorias };
}

// ---------- Ações (criar / apagar / editar) ----------
function criarPedido() {
  state.pedidos.unshift({
    id: uid(),
    nome: $("#novo-nome").value.trim() || "Pedido sem nome",
    dataCompra: $("#novo-compra").value,
    dataChegada: $("#novo-chegada").value,
    taxaPaypal: $("#novo-paypal").value || 0,
    saco: $("#novo-saco").value || 0,
    itens: [],
  });
  $("#novo-nome").value = "";
  $("#novo-compra").value = "";
  $("#novo-chegada").value = "";
  guardar();
  render();
}

function apagarPedido(id) {
  if (!confirm("Apagar este pedido e todos os seus itens?")) return;
  state.pedidos = state.pedidos.filter((p) => p.id !== id);
  guardar();
  render();
}

function adicionarItem(pedidoId) {
  acharPedido(pedidoId).itens.push({
    id: uid(), nome: "", categoria: "", precoCompra: "", precoVenda: "", dataVenda: "",
  });
  guardar();
  render();
}

function apagarItem(pedidoId, itemId) {
  const pedido = acharPedido(pedidoId);
  pedido.itens = pedido.itens.filter((i) => i.id !== itemId);
  guardar();
  render();
}

function editarPedido(id, campo, valor) {
  acharPedido(id)[campo] = valor;
  recalcularPedido(id);
  renderGlobal();
  guardar();
}

function editarItem(pedidoId, itemId, campo, valor) {
  acharItem(acharPedido(pedidoId), itemId)[campo] = valor;
  recalcularPedido(pedidoId);
  renderGlobal();
  guardar();
}

// ---------- Render ----------
function render() {
  renderGlobal();

  const lista = $("#lista");
  if (state.pedidos.length === 0) {
    lista.innerHTML = `<div class="vazio">Ainda não há pedidos. Cria o primeiro acima.</div>`;
    return;
  }

  lista.innerHTML = state.pedidos.map((p, i) => templatePedido(p, i)).join("");
  // depois de inserir o HTML, preenche os valores calculados de cada pedido
  state.pedidos.forEach((p) => recalcularPedido(p.id));
}

function renderGlobal() {
  const r = resumoGlobal();
  setText("stat-investido", eur(r.investido));
  setText("stat-stock", eur(r.stock));
  setText("stat-receita", eur(r.receita));
  setText("stat-lucro", eur(r.lucro));
  setText("stat-pessoa", eur(r.porPessoa));
  renderCategorias(r.categorias);
}

function renderCategorias(categorias) {
  const cont = $("#cat-breakdown");
  const entradas = Object.entries(categorias)
    .filter(([, v]) => v.vendidos > 0)
    .sort((a, b) => b[1].lucro - a[1].lucro);

  if (entradas.length === 0) {
    cont.innerHTML = `<p class="dim pequeno">Ainda sem vendas para mostrar.</p>`;
    return;
  }

  const maxLucro = Math.max(...entradas.map(([, v]) => Math.abs(v.lucro)), 1);

  cont.innerHTML = entradas
    .map(([nome, v]) => {
      const largura = Math.round((Math.abs(v.lucro) / maxLucro) * 100);
      const cor = corCategoria(nome);
      return `
        <div class="cat-linha">
          <span class="cat-nome"><span class="cat-dot" style="background:${cor}"></span>${escapar(nome)}</span>
          <span class="cat-barra"><span style="width:${largura}%;background:${cor}"></span></span>
          <span class="cat-valor ${v.lucro >= 0 ? "pos" : "neg"}">${eur(v.lucro)}</span>
        </div>`;
    })
    .join("");
}

/* Atualiza apenas os números calculados de um pedido (sem reconstruir
   os inputs — assim não se perde o foco enquanto se escreve). */
function recalcularPedido(id) {
  const pedido = acharPedido(id);

  for (const item of pedido.itens) {
    setText(`cr_${item.id}`, eur(custoReal(pedido, item)));

    const dot = document.getElementById(`dot_${item.id}`);
    if (dot) dot.style.background = corCategoria(item.categoria);

    const elMargem = document.getElementById(`mg_${item.id}`);
    const elDias = document.getElementById(`dd_${item.id}`);
    const m = margem(pedido, item);

    if (m !== null) {
      const pct = Math.round((m / toNumber(item.precoVenda)) * 100);
      const dias = diasParaVender(pedido, item);
      elMargem.textContent = `${eur(m)}  ·  ${pct}%`;
      elMargem.className = `calc ${m >= 0 ? "pos" : "neg"}`;
      elDias.textContent = dias !== null ? `${dias} dias` : "—";
      elDias.className = "calc";
    } else {
      elMargem.textContent = "—"; elMargem.className = "calc dim";
      elDias.textContent = "—"; elDias.className = "calc dim";
    }
  }

  const r = resumoPedido(pedido);
  setText(`pinv_${id}`, eur(r.investido));
  setText(`prec_${id}`, eur(r.receita));
  setText(`pvend_${id}`, `${r.vendidos}/${r.total}`);
  setText(`pmar_${id}`, r.margemPct !== null ? `${r.margemPct}%` : "—");
  setText(`pdias_${id}`, r.diasMedios !== null ? `${r.diasMedios} dias` : "—");

  const elLucro = document.getElementById(`pluc_${id}`);
  if (elLucro) {
    elLucro.textContent = eur(r.lucro);
    elLucro.className = `pill-valor ${r.lucro > 0 ? "pos" : r.lucro < 0 ? "neg" : ""}`;
  }
}

// ---------- Templates ----------
function templatePedido(pedido, indice) {
  const atrasoAnim = Math.min(indice, 8) * 0.05;
  const linhas = pedido.itens.length
    ? pedido.itens.map((item) => templateItem(pedido, item)).join("")
    : `<tr><td colspan="8" class="vazio" style="padding:14px 8px">Sem itens neste pedido.</td></tr>`;

  return `
  <article class="pedido" style="animation-delay:${atrasoAnim}s">
    <div class="pedido-topo">
      <div class="pedido-info">
        <div class="pedido-titulo">
          <input value="${escapar(pedido.nome)}" data-acao="pedido" data-pedido="${pedido.id}" data-campo="nome" />
          <button class="btn fantasma" title="Apagar pedido" data-acao="apagar-pedido" data-pedido="${pedido.id}">✕</button>
        </div>
        <div class="pedido-meta">
          <label class="campo"><span>Compra</span>
            <input type="date" value="${pedido.dataCompra || ""}" data-acao="pedido" data-pedido="${pedido.id}" data-campo="dataCompra" /></label>
          <label class="campo"><span>Chegada</span>
            <input type="date" value="${pedido.dataChegada || ""}" data-acao="pedido" data-pedido="${pedido.id}" data-campo="dataChegada" /></label>
          <label class="campo"><span>Taxa PayPal €</span>
            <input class="num pequeno" type="number" step="0.01" value="${pedido.taxaPaypal}" data-acao="pedido" data-pedido="${pedido.id}" data-campo="taxaPaypal" /></label>
          <label class="campo"><span>Saco €</span>
            <input class="num pequeno" type="number" step="0.01" value="${pedido.saco}" data-acao="pedido" data-pedido="${pedido.id}" data-campo="saco" /></label>
        </div>
      </div>
      <div class="pills">
        <div class="pill"><div class="pill-label">Investido</div><div class="pill-valor" id="pinv_${pedido.id}">€0</div></div>
        <div class="pill"><div class="pill-label">Vendidos</div><div class="pill-valor" id="pvend_${pedido.id}">0/0</div></div>
        <div class="pill"><div class="pill-label">Receita</div><div class="pill-valor" id="prec_${pedido.id}">€0</div></div>
        <div class="pill azul"><div class="pill-label">Lucro</div><div class="pill-valor" id="pluc_${pedido.id}">€0</div></div>
        <div class="pill"><div class="pill-label">Margem</div><div class="pill-valor" id="pmar_${pedido.id}">—</div></div>
        <div class="pill"><div class="pill-label">Dias médios</div><div class="pill-valor" id="pdias_${pedido.id}">—</div></div>
      </div>
    </div>

    <div class="tabela-scroll">
      <table>
        <thead>
          <tr>
            <th>Item</th><th>Categoria</th>
            <th class="dir">Preço compra</th><th class="dir">Preço venda</th>
            <th>Data venda</th>
            <th class="dir">Custo real</th><th class="dir">Margem</th><th class="dir">Dias</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>

    <button class="btn add-item" data-acao="add-item" data-pedido="${pedido.id}">+ Adicionar item</button>
  </article>`;
}

function templateItem(pedido, item) {
  const ref = `data-acao="item" data-pedido="${pedido.id}" data-item="${item.id}"`;
  return `
  <tr>
    <td>
      <span class="td-nome">
        <span class="dot" id="dot_${item.id}" style="background:${corCategoria(item.categoria)}"></span>
        <input class="w-nome" placeholder="ex: Brasil #10" value="${escapar(item.nome)}" ${ref} data-campo="nome" />
      </span>
    </td>
    <td><input class="w-cat" list="categorias" placeholder="categoria" value="${escapar(item.categoria)}" ${ref} data-campo="categoria" /></td>
    <td class="dir"><input class="num w-num" type="number" step="0.01" placeholder="€" value="${item.precoCompra}" ${ref} data-campo="precoCompra" /></td>
    <td class="dir"><input class="num w-num" type="number" step="0.01" placeholder="€" value="${item.precoVenda}" ${ref} data-campo="precoVenda" /></td>
    <td><input class="w-data" type="date" value="${item.dataVenda || ""}" ${ref} data-campo="dataVenda" /></td>
    <td class="dir"><span class="calc dim" id="cr_${item.id}">€0</span></td>
    <td class="dir"><span class="calc dim" id="mg_${item.id}">—</span></td>
    <td class="dir"><span class="calc dim" id="dd_${item.id}">—</span></td>
    <td class="dir"><button class="btn fantasma" title="Apagar item" data-acao="apagar-item" data-pedido="${pedido.id}" data-item="${item.id}">✕</button></td>
  </tr>`;
}

// ---------- Backup (exportar / importar JSON) ----------
function exportar() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `resell-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importar(ficheiro) {
  if (!ficheiro) return;
  const leitor = new FileReader();
  leitor.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (dados && Array.isArray(dados.pedidos)) {
        Object.assign(state, dados);
        $("#socios").value = state.socios ?? 2;
        guardar();
        render();
      } else {
        alert("Ficheiro inválido.");
      }
    } catch {
      alert("Não foi possível ler o ficheiro.");
    }
  };
  leitor.readAsText(ficheiro);
}

// ---------- Ligação de eventos ----------
// Um único listener delegado trata de todos os inputs das tabelas/pedidos.
$("#lista").addEventListener("input", (e) => {
  const el = e.target;
  const acao = el.dataset.acao;
  if (acao === "pedido") editarPedido(el.dataset.pedido, el.dataset.campo, el.value);
  else if (acao === "item") editarItem(el.dataset.pedido, el.dataset.item, el.dataset.campo, el.value);
});

$("#lista").addEventListener("click", (e) => {
  const botao = e.target.closest("button[data-acao]");
  if (!botao) return;
  const { acao, pedido, item } = botao.dataset;
  if (acao === "add-item") adicionarItem(pedido);
  else if (acao === "apagar-item") apagarItem(pedido, item);
  else if (acao === "apagar-pedido") apagarPedido(pedido);
});

$("#btn-criar").addEventListener("click", criarPedido);
$("#btn-exportar").addEventListener("click", exportar);
$("#btn-importar").addEventListener("click", () => $("#ficheiro-import").click());
$("#ficheiro-import").addEventListener("change", (e) => {
  importar(e.target.files[0]);
  e.target.value = "";
});
$("#socios").addEventListener("input", (e) => {
  state.socios = e.target.value;
  renderGlobal();
  guardar();
});

// ---------- Arranque ----------
carregar();
$("#socios").value = state.socios ?? 2;
render();
