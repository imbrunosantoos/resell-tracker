import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { criarItem } from "@/lib/repo";

export async function POST(request) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const { pedidoId, ...dados } = await request.json().catch(() => ({}));
  try {
    return NextResponse.json(criarItem(pedidoId, dados));
  } catch (erro) {
    return NextResponse.json({ erro: erro.message }, { status: 400 });
  }
}
