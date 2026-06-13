import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { atribuirVariante } from "@/lib/repo";

// Liga (ou desliga, varianteId vazio) um item a uma variante do catálogo.
export async function POST(request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const { varianteId } = await request.json().catch(() => ({}));
  try {
    return NextResponse.json(atribuirVariante(params.id, varianteId || ""));
  } catch (erro) {
    return NextResponse.json({ erro: erro.message }, { status: 400 });
  }
}
