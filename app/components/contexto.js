"use client";

import { createContext, useContext } from "react";

// Contexto com o estado do negócio + todas as ações. O AppShell é quem o
// fornece; as páginas consomem via useEstado().
export const EstadoContexto = createContext(null);

export function useEstado() {
  const ctx = useContext(EstadoContexto);
  if (!ctx) throw new Error("useEstado() tem de ser usado dentro do <AppShell>.");
  return ctx;
}
