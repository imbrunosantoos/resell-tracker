import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { criarPatch } from "@/lib/repo";

export async function POST(request) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const dados = await request.json().catch(() => ({}));
  return NextResponse.json(criarPatch(dados));
}
