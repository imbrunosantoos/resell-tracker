import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { lerEstado } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  return NextResponse.json(lerEstado());
}
