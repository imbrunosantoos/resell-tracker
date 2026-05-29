import { NextResponse } from "next/server";
import { entrar, registar } from "@/lib/auth";

export async function POST(request) {
  try {
    const { nome, password, modo } = await request.json();
    const utilizador = modo === "registar"
      ? await registar(nome, password)
      : await entrar(nome, password);
    return NextResponse.json({ utilizador });
  } catch (erro) {
    return NextResponse.json({ erro: erro.message }, { status: 400 });
  }
}
