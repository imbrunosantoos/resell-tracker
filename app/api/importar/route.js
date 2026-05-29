import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { importarEstado, lerEstado } from "@/lib/repo";

export async function POST(request) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  try {
    const estado = await request.json();
    importarEstado(estado);
    return NextResponse.json(lerEstado());
  } catch (erro) {
    return NextResponse.json({ erro: erro.message }, { status: 400 });
  }
}
