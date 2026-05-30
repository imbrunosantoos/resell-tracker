import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { criarCredencial, lerCredenciais } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  return NextResponse.json(lerCredenciais());
}

export async function POST(request) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const dados = await request.json().catch(() => ({}));
  return NextResponse.json(criarCredencial(dados));
}
