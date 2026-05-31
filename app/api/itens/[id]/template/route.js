import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { aplicarTemplate } from "@/lib/repo";

// Preenche um item a partir de outro (autofill): copia nome, categoria, preço de
// compra e uma cópia da foto.
export async function POST(request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const { origemId } = await request.json().catch(() => ({}));
  try {
    return NextResponse.json(aplicarTemplate(params.id, origemId));
  } catch (erro) {
    return NextResponse.json({ erro: erro.message }, { status: 400 });
  }
}
