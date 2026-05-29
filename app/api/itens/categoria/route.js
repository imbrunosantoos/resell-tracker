import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { atualizarCategoriaItens } from "@/lib/repo";

// Muda a categoria de vários itens de uma vez (seleção em massa na tabela).
export async function POST(request) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const { ids, categoria } = await request.json().catch(() => ({}));
  const alterados = atualizarCategoriaItens(ids, categoria);
  return NextResponse.json({ alterados });
}
