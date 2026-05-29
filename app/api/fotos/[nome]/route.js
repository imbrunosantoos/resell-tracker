import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { lerFoto } from "@/lib/fotos";

// Serve uma foto guardada em data/uploads (só com sessão).
export async function GET(_request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });

  const foto = lerFoto(params.nome);
  if (!foto) return new NextResponse("Não encontrada", { status: 404 });

  return new NextResponse(foto.buffer, {
    headers: { "Content-Type": foto.tipo, "Cache-Control": "private, max-age=86400" },
  });
}
