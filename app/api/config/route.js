import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { gravarConfig } from "@/lib/repo";

export async function PATCH(request) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const parcial = await request.json().catch(() => ({}));
  return NextResponse.json(gravarConfig(parcial));
}
