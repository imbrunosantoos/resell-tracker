/* =========================================================
   Cálculos do negócio — partilhados entre servidor e browser.
   Trabalham sempre sobre objetos em camelCase:
     pedido { id, nome, dataCompra, dataChegada, taxaPaypal, saco, itens[] }
     item   { id, nome, categoria, precoCompra, precoVenda, dataVenda }
   O custo real de um item é o que pagaste + a taxa de PayPal diluída
   pelos itens do pedido + o saco. Daí saem margem, % e dias até vender.
   ========================================================= */

// aceita "12,50" ou "12.50"; devolve sempre número
export function toNumber(v) {
  if (typeof v === "number") return Number.isNaN(v) ? 0 : v;
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

export function eur(n) {
  return "€" + (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
}

export function diasEntre(de, ate) {
  if (!de || !ate) return null;
  const d = Math.round((Date.parse(ate) - Date.parse(de)) / 86_400_000);
  return Number.isNaN(d) ? null : d;
}

// ---------- Custo, margem e dias ----------
export function taxaPorItem(pedido) {
  const n = pedido.itens.length;
  return n > 0 ? toNumber(pedido.taxaPaypal) / n : 0;
}

export function custoReal(pedido, item) {
  return toNumber(item.precoCompra) + taxaPorItem(pedido) + toNumber(pedido.saco);
}

export const estaVendido = (item) =>
  toNumber(item.precoVenda) > 0 && Boolean(item.dataVenda);

export function margem(pedido, item) {
  return estaVendido(item) ? toNumber(item.precoVenda) - custoReal(pedido, item) : null;
}

export function margemPct(pedido, item) {
  const m = margem(pedido, item);
  if (m === null) return null;
  const venda = toNumber(item.precoVenda);
  return venda > 0 ? Math.round((m / venda) * 100) : null;
}

export function diasParaVender(pedido, item) {
  if (!estaVendido(item)) return null;
  return diasEntre(pedido.dataChegada || pedido.dataCompra, item.dataVenda);
}

// Quantos dias é que um item ainda por vender já leva parado em stock.
export function diasEmStock(pedido, item, hoje = new Date()) {
  if (estaVendido(item)) return null;
  const base = pedido.dataChegada || pedido.dataCompra;
  return diasEntre(base, hoje.toISOString().slice(0, 10));
}

// Preço mínimo de venda para atingir a margem desejada (sobre o preço de venda).
// margem% = (venda - custo) / venda  =>  venda = custo / (1 - margem%/100)
export function precoMinimo(pedido, item, margemMinimaPct) {
  const custo = custoReal(pedido, item);
  const m = toNumber(margemMinimaPct);
  if (m <= 0) return custo;
  if (m >= 100) return null; // margem impossível
  return custo / (1 - m / 100);
}

// ---------- Resumo de um pedido ----------
export function resumoPedido(pedido) {
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

// ---------- Resumo global ----------
export function resumoGlobal(estado) {
  const pedidos = estado.pedidos ?? [];
  const despesas = estado.despesas ?? [];

  let investido = 0, receita = 0, lucro = 0, stock = 0;
  const categorias = {}; // nome -> { lucro, vendidos, total, somaDias, comDias }

  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      const custo = custoReal(pedido, item);
      investido += custo;

      const cat = item.categoria?.trim() || "Sem categoria";
      categorias[cat] ??= { lucro: 0, vendidos: 0, total: 0, somaDias: 0, comDias: 0 };
      categorias[cat].total++;

      if (estaVendido(item)) {
        const m = margem(pedido, item);
        receita += toNumber(item.precoVenda);
        lucro += m;
        categorias[cat].lucro += m;
        categorias[cat].vendidos++;
        const dias = diasParaVender(pedido, item);
        if (dias !== null) { categorias[cat].somaDias += dias; categorias[cat].comDias++; }
      } else {
        stock += custo;
      }
    }
  }

  // Despesas (overhead teu, não se dividem pelos sócios). Cada despesa tem data:
  // as únicas contam uma vez (no seu mês); as mensais contam por cada mês desde
  // a sua data até ao mês atual.
  const mesAtual = chaveMes(new Date());
  const meses = mesesAtivos(pedidos); // só para o rótulo informativo
  const despesasTotal = despesas.reduce(
    (soma, d) => soma + toNumber(d.valor) * ocorrencias(d, mesAtual), 0);
  const lucroReal = lucro - despesasTotal;

  const { meu, socios } = lucroPorSocio(estado);

  return {
    investido, receita, lucro, stock,
    despesasTotal, lucroReal, mesesAtivos: meses,
    meuLucro: meu, porSocio: socios,
    categorias,
  };
}

// ---------- Despesas: atribuição ao mês certo (cada despesa tem data) ----------
const mesDespesa = (d) => (d.data || "").slice(0, 7); // 'YYYY-MM'

// nº de meses de `ini` a `ate` inclusive (0 se ini for depois de ate ou inválido)
function mesesEntre(ini, ate) {
  if (!ini || !ate || ini > ate) return 0;
  const [ay, am] = ini.split("-").map(Number);
  const [by, bm] = ate.split("-").map(Number);
  return (by - ay) * 12 + (bm - am) + 1;
}

// quantas vezes a despesa conta até ao mês `ateMes` (totais até agora)
function ocorrencias(d, ateMes) {
  const mes = mesDespesa(d);
  if (!mes || mes > ateMes) return 0;
  return d.periodo === "mensal" ? mesesEntre(mes, ateMes) : 1;
}

// a despesa conta no mês M? (gráfico mês a mês) — 1 ou 0
function contaNoMes(d, M) {
  const mes = mesDespesa(d);
  if (!mes) return 0;
  return d.periodo === "mensal" ? (mes <= M ? 1 : 0) : (mes === M ? 1 : 0);
}

// parte-base de uma despesa (sem meses): inteira se só minha, metade se dividida
const minhaParteBase = (d) => (d.socioId ? toNumber(d.valor) / 2 : toNumber(d.valor));
const parteSocioBase = (d, socioId) => (d.socioId === socioId ? toNumber(d.valor) / 2 : 0);

// Reparte o lucro: pedidos feitos com um sócio dividem a meias (metade para ti,
// metade para o sócio); pedidos a solo são 100% teus. Depois desconta as despesas
// (a tua parte ao teu lucro; a metade do sócio ao lucro dele). O lucro devolvido
// já é líquido de despesas.
export function lucroPorSocio(estado) {
  const pedidos = estado.pedidos ?? [];
  const socios = estado.socios ?? [];
  const despesas = estado.despesas ?? [];
  const mesAtual = chaveMes(new Date());
  const idsValidos = new Set(socios.map((s) => s.id));

  // todos os sócios entram (mesmo sem vendas), para a contagem aparecer certa
  const porSocio = new Map();
  for (const s of socios) porSocio.set(s.id, { id: s.id, nome: s.nome, lucro: 0, pedidos: new Set() });

  let meuVendas = 0;
  for (const pedido of pedidos) {
    const comSocio = pedido.socioId && idsValidos.has(pedido.socioId);
    if (comSocio) porSocio.get(pedido.socioId).pedidos.add(pedido.id); // conta TODOS os pedidos dele
    for (const item of pedido.itens) {
      if (!estaVendido(item)) continue;
      const m = margem(pedido, item);
      if (comSocio) { meuVendas += m / 2; porSocio.get(pedido.socioId).lucro += m / 2; }
      else meuVendas += m; // solo (ou sócio apagado)
    }
  }

  // despesas: a minha parte sai do meu lucro; a metade do sócio sai do dele.
  // Cada despesa conta as vezes certas até ao mês atual (mensal = nº de meses).
  let minhasDespesas = 0;
  for (const d of despesas) {
    const ocor = ocorrencias(d, mesAtual);
    minhasDespesas += minhaParteBase(d) * ocor;
    if (d.socioId && porSocio.has(d.socioId)) {
      porSocio.get(d.socioId).lucro -= parteSocioBase(d, d.socioId) * ocor;
    }
  }

  return {
    meu: meuVendas - minhasDespesas,
    minhasDespesas,
    socios: [...porSocio.values()]
      .map((s) => ({ id: s.id, nome: s.nome, lucro: s.lucro, pedidos: s.pedidos.size }))
      .sort((a, b) => b.lucro - a.lucro),
  };
}

// Quantos meses (>=1) a operação leva ativa, a contar da data mais antiga.
function mesesAtivos(pedidos) {
  let maisAntiga = null;
  for (const p of pedidos) {
    for (const d of [p.dataCompra, p.dataChegada]) {
      const t = Date.parse(d);
      if (!Number.isNaN(t) && (maisAntiga === null || t < maisAntiga)) maisAntiga = t;
    }
  }
  if (maisAntiga === null) return 1;
  const agora = new Date();
  const inicio = new Date(maisAntiga);
  const meses =
    (agora.getFullYear() - inicio.getFullYear()) * 12 +
    (agora.getMonth() - inicio.getMonth()) + 1;
  return Math.max(1, meses);
}

// ---------- Relatório mensal (o MEU lucro) ----------
// Lucro do Bruno e nº de vendas do mês atual vs. o mês anterior.
export function relatorioMensal(estado) {
  const dados = dadosMensais(estado);
  const agora = new Date();
  const kAtual = chaveMes(agora);
  const kAnt = chaveMes(new Date(agora.getFullYear(), agora.getMonth() - 1, 1));
  const achar = (k) => dados.find((d) => d.mes === k) ?? { meuLucro: 0, vendas: 0 };

  const atual = achar(kAtual);
  const anterior = achar(kAnt);
  return {
    atual: { lucro: atual.meuLucro, vendas: atual.vendas, label: kAtual },
    anterior: { lucro: anterior.meuLucro, vendas: anterior.vendas, label: kAnt },
    variacao: atual.meuLucro - anterior.meuLucro,
  };
}

// ---------- Dados mês a mês (para o gráfico) ----------
// Devolve um ponto por mês, do mês mais antigo até ao atual:
//   recebido  = Σ preço de venda dos itens vendidos nesse mês (por data de venda)
//   investido = Σ custo real dos itens dos pedidos comprados nesse mês (por data de compra)
//   meuLucro  = a minha parte das vendas do mês − a minha parte das despesas mensais
//               (no mês atual também desconto a minha parte das despesas únicas)
//   vendas    = nº de itens vendidos no mês
export function dadosMensais(estado) {
  const pedidos = estado.pedidos ?? [];
  const socios = estado.socios ?? [];
  const despesas = estado.despesas ?? [];
  const idsValidos = new Set(socios.map((s) => s.id));

  const buckets = new Map(); // 'YYYY-MM' -> { recebido, investido, meuVendas, vendas }
  const garante = (k) => {
    if (!buckets.has(k)) buckets.set(k, { recebido: 0, investido: 0, meuVendas: 0, vendas: 0 });
    return buckets.get(k);
  };

  for (const pedido of pedidos) {
    const comSocio = pedido.socioId && idsValidos.has(pedido.socioId);
    const kCompra = (pedido.dataCompra || "").slice(0, 7);
    for (const item of pedido.itens) {
      if (kCompra) garante(kCompra).investido += custoReal(pedido, item);
      if (!estaVendido(item)) continue;
      const b = garante(item.dataVenda.slice(0, 7));
      b.recebido += toNumber(item.precoVenda);
      b.vendas++;
      b.meuVendas += comSocio ? margem(pedido, item) / 2 : margem(pedido, item);
    }
  }

  // intervalo de meses a mostrar: também inclui os meses das despesas (p.ex. uma
  // despesa de um mês sem vendas), do mais antigo até ao mês atual.
  const mesAtual = chaveMes(new Date());
  const chavesDespesa = despesas.map(mesDespesa).filter(Boolean);
  const chaves = [...buckets.keys(), ...chavesDespesa].filter(Boolean).sort();
  const meses = intervaloMeses(chaves[0] || mesAtual, mesAtual);

  return meses.map((mes) => {
    const b = buckets.get(mes) ?? { recebido: 0, investido: 0, meuVendas: 0, vendas: 0 };
    // a minha parte das despesas que caem neste mês (única no seu mês; mensal recorrente)
    const despesaMes = despesas.reduce((s, d) => s + minhaParteBase(d) * contaNoMes(d, mes), 0);
    return { mes, recebido: b.recebido, investido: b.investido, meuLucro: b.meuVendas - despesaMes, vendas: b.vendas };
  });
}

const chaveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// Lista contígua de meses 'YYYY-MM' de `inicio` a `fim` (inclusive).
function intervaloMeses(inicio, fim) {
  const [ai, mi] = inicio.split("-").map(Number);
  const [af, mf] = fim.split("-").map(Number);
  const out = [];
  let y = ai, m = mi;
  for (let i = 0; i < 600 && (y < af || (y === af && m <= mf)); i++) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) { m = 1; y++; }
  }
  return out.length ? out : [fim];
}

// Métricas por categoria já prontas para mostrar (ordenadas por lucro).
export function categoriasOrdenadas(categorias) {
  return Object.entries(categorias)
    .map(([nome, v]) => ({
      nome,
      lucro: v.lucro,
      vendidos: v.vendidos,
      total: v.total,
      sellThrough: v.total > 0 ? Math.round((v.vendidos / v.total) * 100) : 0,
      diasMedios: v.comDias > 0 ? Math.round(v.somaDias / v.comDias) : null,
    }))
    .sort((a, b) => b.lucro - a.lucro);
}

