import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { lerEstado } from "@/lib/repo";
import { custoReal, margem, margemPct, diasParaVender, estaVendido } from "@/lib/calculos";

export async function GET(request) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });

  const formato = new URL(request.url).searchParams.get("formato") ?? "json";
  const estado = lerEstado();
  const hoje = new Date().toISOString().slice(0, 10);

  if (formato === "csv") {
    const csv = gerarCSV(estado);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="resell-tracker-${hoje}.csv"`,
      },
    });
  }

  // JSON: backup completo, igual ao que o importador aceita. As credenciais
  // ficam de fora de propósito — não faz sentido exportar passwords em claro.
  const { credenciais, ...backup } = estado;
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="resell-tracker-${hoje}.json"`,
    },
  });
}

// CSV com uma linha por item e as colunas já calculadas — pronto para Excel/Sheets.
function gerarCSV(estado) {
  const cabecalho = [
    "Pedido", "Item", "Categoria", "Tamanho", "Preço compra", "Preço venda",
    "Data venda", "Custo real", "Margem", "Margem %", "Dias até vender", "Estado",
  ];

  const linhas = [cabecalho];
  for (const pedido of estado.pedidos) {
    for (const item of pedido.itens) {
      const vendido = estaVendido(item);
      linhas.push([
        pedido.nome,
        item.nome,
        item.categoria,
        item.tamanho || "",
        item.precoCompra,
        vendido ? item.precoVenda : "",
        item.dataVenda || "",
        arred(custoReal(pedido, item)),
        vendido ? arred(margem(pedido, item)) : "",
        vendido ? margemPct(pedido, item) : "",
        vendido ? diasParaVender(pedido, item) ?? "" : "",
        vendido ? "Vendido" : "Em stock",
      ]);
    }
  }

  // separador ; porque o Excel europeu usa a vírgula como decimal
  return "﻿" + linhas.map((linha) => linha.map(celula).join(";")).join("\n");
}

const arred = (n) => Math.round(n * 100) / 100;

function celula(valor) {
  const s = String(valor ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
