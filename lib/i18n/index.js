/* =========================================================
   i18n simples: dicionários chave→texto por idioma (PT/EN/ES), com PT como
   base/fallback. traduzir(idioma, chave, vars) faz o lookup e interpola {n}.
   A UI usa o hook useIdioma() (app/components/Idioma.jsx). Os DADOS do
   utilizador (nomes de pedidos/sócios/categorias) nunca passam por aqui.
   ========================================================= */

import pt from "./pt";
import en from "./en";
import es from "./es";

export const DICIONARIOS = { pt, en, es };

export const IDIOMAS = [
  { codigo: "pt", nome: "Português", bandeira: "🇵🇹" },
  { codigo: "en", nome: "English", bandeira: "🇬🇧" },
  { codigo: "es", nome: "Español", bandeira: "🇪🇸" },
];

const LOCALES = { pt: "pt-PT", en: "en-GB", es: "es-ES" };
export const localeDe = (idioma) => LOCALES[idioma] || "pt-PT";
export const IDIOMA_PADRAO = "pt";
export const ehIdioma = (v) => Boolean(LOCALES[v]);

export function traduzir(idioma, chave, vars) {
  const dic = DICIONARIOS[idioma] || DICIONARIOS.pt;
  let txt = dic[chave];
  if (txt == null) txt = DICIONARIOS.pt[chave]; // fallback para PT
  if (txt == null) txt = chave; // último recurso: a própria chave
  if (vars) for (const [k, v] of Object.entries(vars)) txt = txt.split(`{${k}}`).join(String(v));
  return txt;
}
