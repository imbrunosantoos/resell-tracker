import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { apagarAcerto } from "@/lib/repo";

export async function DELETE(_request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  apagarAcerto(params.id);
  return NextResponse.json({ ok: true });
}
