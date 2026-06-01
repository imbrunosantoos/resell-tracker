import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { aplicarTemplateLinha } from "@/lib/repo";

// Autofill numa linha do rascunho a partir de um item existente.
export async function POST(request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const { origemId } = await request.json().catch(() => ({}));
  try {
    return NextResponse.json(aplicarTemplateLinha(params.id, origemId));
  } catch (erro) {
    return NextResponse.json({ erro: erro.message }, { status: 400 });
  }
}
