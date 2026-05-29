import { redirect } from "next/navigation";
import { utilizadorAtual } from "@/lib/auth";
import { lerEstado } from "@/lib/repo";
import Dashboard from "./components/Dashboard";

// Página principal: corre no servidor, garante a sessão e entrega já o estado
// inicial ao cliente (sem flash de loading no primeiro carregamento).
export default function Pagina() {
  const utilizador = utilizadorAtual();
  if (!utilizador) redirect("/login");

  const estadoInicial = lerEstado();
  return <Dashboard utilizador={utilizador} estadoInicial={estadoInicial} />;
}
