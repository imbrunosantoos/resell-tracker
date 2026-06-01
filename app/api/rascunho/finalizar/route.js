import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { finalizarRascunho } from "@/lib/repo";

// "Criar pedido": converte o rascunho num pedido real (quantidade → N itens).
export async function POST(request) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const dados = await request.json().catch(() => ({}));
  try {
    return NextResponse.json(finalizarRascunho(dados));
  } catch (erro) {
    return NextResponse.json({ erro: erro.message }, { status: 400 });
  }
}
