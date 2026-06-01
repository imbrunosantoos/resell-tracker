import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { atualizarLinha, apagarLinha } from "@/lib/repo";

export async function PATCH(request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const parcial = await request.json().catch(() => ({}));
  return NextResponse.json(atualizarLinha(params.id, parcial));
}

export async function DELETE(_request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  apagarLinha(params.id);
  return NextResponse.json({ ok: true });
}
