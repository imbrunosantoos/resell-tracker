import { redirect } from "next/navigation";
import { utilizadorAtual, existemContas } from "@/lib/auth";
import FormularioLogin from "./FormularioLogin";

export default function PaginaLogin() {
  // Já com sessão? não há nada a fazer aqui.
  if (utilizadorAtual()) redirect("/");

  // Se ainda não existe nenhuma conta, abrimos logo no modo "criar conta".
  const haContas = existemContas();
  return <FormularioLogin modoInicial={haContas ? "entrar" : "registar"} />;
}
