import { NextResponse } from "next/server";
import { utilizadorAtual } from "@/lib/auth";
import { lerItem, atualizarItem } from "@/lib/repo";
import { guardarFoto, apagarFoto } from "@/lib/fotos";

// Upload da foto de um item (multipart). Aceita qualquer formato de imagem.
export async function POST(request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });

  const item = lerItem(params.id);
  if (!item) return NextResponse.json({ erro: "Item não encontrado." }, { status: 404 });

  const form = await request.formData();
  const file = form.get("foto");
  if (!file || typeof file === "string") {
    return NextResponse.json({ erro: "Sem ficheiro." }, { status: 400 });
  }

  apagarFoto(item.foto); // substitui a anterior, se houver
  const nome = await guardarFoto(file);
  return NextResponse.json(atualizarItem(params.id, { foto: nome }));
}

export async function DELETE(_request, { params }) {
  if (!utilizadorAtual()) return NextResponse.json({ erro: "Sem sessão." }, { status: 401 });
  const item = lerItem(params.id);
  if (item?.foto) apagarFoto(item.foto);
  return NextResponse.json(atualizarItem(params.id, { foto: "" }));
}
