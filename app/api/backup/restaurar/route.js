import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { restaurarBackup } from "@/lib/backups";

export async function POST(request) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const { nome } = await request.json().catch(() => ({}));
  try {
    return NextResponse.json(restaurarBackup(nome));
  } catch (erro) {
    return NextResponse.json({ erro: erro.message || "Não foi possível restaurar." }, { status: 400 });
  }
}
