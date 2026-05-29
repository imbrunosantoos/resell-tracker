import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { atualizarItem, apagarItem } from "@/lib/repo";

export async function PATCH(request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const parcial = await request.json().catch(() => ({}));
  return NextResponse.json(atualizarItem(params.id, parcial));
}

export async function DELETE(_request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  apagarItem(params.id);
  return NextResponse.json({ ok: true });
}
