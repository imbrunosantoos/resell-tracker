import { redirect } from "next/navigation";
import { utilizadorAtual } from "@/lib/auth";
import { lerEstado } from "@/lib/repo";
import AppShell from "@/app/components/AppShell";

// Layout das páginas autenticadas: garante a sessão e entrega o estado inicial
// ao AppShell (que o mantém vivo durante a navegação entre abas).
export default function LayoutApp({ children }) {
  const utilizador = utilizadorAtual();
  if (!utilizador) redirect("/login");

  const estadoInicial = lerEstado();
  return (
    <AppShell utilizador={utilizador} estadoInicial={estadoInicial}>
      {children}
    </AppShell>
  );
}
