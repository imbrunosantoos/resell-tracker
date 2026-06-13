import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { atualizarItensEmMassa } from "@/lib/repo";

// Edição em massa de itens selecionados (categoria, tamanho, preço de compra…).
export async function POST(request) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const { ids, campos } = await request.json().catch(() => ({}));
  const alterados = atualizarItensEmMassa(ids, campos);
  return NextResponse.json({ alterados });
}
