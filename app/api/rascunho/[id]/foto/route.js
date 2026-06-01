import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { lerLinha, atualizarLinha } from "@/lib/repo";
import { guardarFoto, apagarFoto } from "@/lib/fotos";

// Upload da foto de uma linha do rascunho (multipart). Aceita qualquer imagem.
export async function POST(request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });

  const linha = lerLinha(params.id);
  if (!linha) return NextResponse.json({ erro: "Linha não encontrada." }, { status: 404 });

  const form = await request.formData();
  const file = form.get("foto");
  if (!file || typeof file === "string") {
    return NextResponse.json({ erro: "Sem ficheiro." }, { status: 400 });
  }

  apagarFoto(linha.foto); // substitui a anterior
  const nome = await guardarFoto(file);
  return NextResponse.json(atualizarLinha(params.id, { foto: nome }));
}
