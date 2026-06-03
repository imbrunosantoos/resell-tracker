"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { traduzir, localeDe, IDIOMA_PADRAO } from "@/lib/i18n";

// Contexto de idioma. O IdiomaProvider é montado no layout raiz com o idioma
// inicial lido do cookie (no servidor), por isso o primeiro render do servidor
// e do cliente coincidem (sem hydration mismatch). A preferência é POR
// DISPOSITIVO (cookie), não nos dados partilhados do negócio.
const IdiomaContexto = createContext(null);

export function IdiomaProvider({ inicial, children }) {
  const [idioma, setIdiomaState] = useState(inicial || IDIOMA_PADRAO);

  const setIdioma = useCallback((novo) => {
    setIdiomaState(novo);
    document.cookie = `idioma=${novo};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    document.documentElement.lang = novo;
  }, []);

  const t = useCallback((chave, vars) => traduzir(idioma, chave, vars), [idioma]);

  return (
    <IdiomaContexto.Provider value={{ idioma, setIdioma, t, locale: localeDe(idioma) }}>
      {children}
    </IdiomaContexto.Provider>
  );
}

export function useIdioma() {
  const ctx = useContext(IdiomaContexto);
  if (!ctx) throw new Error("useIdioma() tem de ser usado dentro de <IdiomaProvider>.");
  return ctx;
}
