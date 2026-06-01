import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { lerPatch, atualizarPatch } from "@/lib/repo";
import { guardarFoto, apagarFoto } from "@/lib/fotos";

// Upload da foto de um patch (multipart). Aceita qualquer imagem.
export async function POST(request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });

  const patch = lerPatch(params.id);
  if (!patch) return NextResponse.json({ erro: "Patch não encontrado." }, { status: 404 });

  const form = await request.formData();
  const file = form.get("foto");
  if (!file || typeof file === "string") {
    return NextResponse.json({ erro: "Sem ficheiro." }, { status: 400 });
  }

  apagarFoto(patch.foto);
  const nome = await guardarFoto(file);
  return NextResponse.json(atualizarPatch(params.id, { foto: nome }));
}
