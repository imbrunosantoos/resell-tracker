import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { guardarSnapshot, listarBackups } from "@/lib/backups";

export async function POST() {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  return NextResponse.json(guardarSnapshot());
}

export async function GET() {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  return NextResponse.json(listarBackups());
}
