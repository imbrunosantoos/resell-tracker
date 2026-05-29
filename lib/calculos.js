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

  // Despesas: as mensais multiplicam pelos meses que a operação leva ativa;
  // as únicas contam uma vez. As despesas são overhead teu (não se dividem
  // pelos sócios).
  const meses = mesesAtivos(pedidos);
  const despesasTotal = despesas.reduce((soma, d) => {
    const valor = toNumber(d.valor);
    return soma + (d.periodo === "mensal" ? valor * meses : valor);
  }, 0);
  const lucroReal = lucro - despesasTotal;

  const { meu, socios } = lucroPorSocio(estado);

  return {
    investido, receita, lucro, stock,
    despesasTotal, lucroReal, mesesAtivos: meses,
    meuLucro: meu, porSocio: socios,
    categorias,
  };
}

// Reparte o lucro das vendas: pedidos feitos com um sócio dividem a meias
// (metade para ti, metade para o sócio); pedidos a solo são 100% teus.
export function lucroPorSocio(estado) {
  const pedidos = estado.pedidos ?? [];
  const socios = estado.socios ?? [];
  const nomePorId = new Map(socios.map((s) => [s.id, s.nome]));

  let meu = 0;
  const porSocio = new Map(); // socioId -> { nome, lucro, pedidos:Set }

  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      if (!estaVendido(item)) continue;
      const m = margem(pedido, item);

      if (pedido.socioId && nomePorId.has(pedido.socioId)) {
        meu += m / 2;
        const atual = porSocio.get(pedido.socioId) ?? {
          id: pedido.socioId, nome: nomePorId.get(pedido.socioId), lucro: 0, pedidos: new Set(),
        };
        atual.lucro += m / 2;
        atual.pedidos.add(pedido.id);
        porSocio.set(pedido.socioId, atual);
      } else {
        meu += m; // solo (ou sócio apagado)
      }
    }
  }

  return {
    meu,
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

// ---------- Relatório mensal ----------
// Lucro e nº de vendas do mês atual e do mês anterior, pela data de venda.
export function relatorioMensal(pedidos) {
  const agora = new Date();
  const chaveAtual = chaveMes(agora);
  const anterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const chaveAnt = chaveMes(anterior);

  const meses = {}; // 'YYYY-MM' -> { lucro, vendas }
  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      if (!estaVendido(item)) continue;
      const k = item.dataVenda.slice(0, 7);
      meses[k] ??= { lucro: 0, vendas: 0 };
      meses[k].lucro += margem(pedido, item);
      meses[k].vendas++;
    }
  }

  const atual = meses[chaveAtual] ?? { lucro: 0, vendas: 0 };
  const ant = meses[chaveAnt] ?? { lucro: 0, vendas: 0 };
  return {
    atual: { ...atual, label: chaveAtual },
    anterior: { ...ant, label: chaveAnt },
    variacao: atual.lucro - ant.lucro,
  };
}

const chaveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

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

// ---------- Série temporal: lucro acumulado, semana a semana ----------
// Junta todos os itens vendidos, agrupa pela semana (segunda-feira) da venda
// e devolve pontos com o lucro acumulado até essa semana.
export function serieLucroAcumulado(pedidos) {
  const porSemana = new Map(); // 'YYYY-MM-DD' (segunda) -> lucro dessa semana

  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      if (!estaVendido(item)) continue;
      const semana = inicioSemana(item.dataVenda);
      if (!semana) continue;
      porSemana.set(semana, (porSemana.get(semana) ?? 0) + margem(pedido, item));
    }
  }

  const semanas = [...porSemana.keys()].sort();
  let acumulado = 0;
  return semanas.map((semana) => {
    acumulado += porSemana.get(semana);
    return { semana, lucro: acumulado };
  });
}

// Devolve a segunda-feira da semana de uma data 'YYYY-MM-DD'.
function inicioSemana(dataISO) {
  const t = Date.parse(dataISO);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  const diaSemana = (d.getUTCDay() + 6) % 7; // 0 = segunda
  d.setUTCDate(d.getUTCDate() - diaSemana);
  return d.toISOString().slice(0, 10);
}
