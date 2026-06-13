"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdioma } from "./Idioma";
import { IDIOMAS } from "@/lib/i18n";

// Seletor de idioma: botão com a bandeira atual que abre um mini-menu PT/EN/ES.
// Fecha ao escolher, ao clicar fora ou no Escape.
function SeletorIdioma() {
  const { t, idioma, setIdioma } = useIdioma();
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  const atual = IDIOMAS.find((i) => i.codigo === idioma) ?? IDIOMAS[0];

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    const esc = (e) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);

  return (
    <div className="nav-idioma" ref={ref}>
      <button type="button" className="nav-idioma-btn" aria-label={t("idioma.label")}
        aria-haspopup="listbox" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span className="bandeira">{atual.bandeira}</span>
        <span className="seta">▾</span>
      </button>
      {aberto && (
        <ul className="nav-idioma-menu" role="listbox">
          {IDIOMAS.map((i) => (
            <li key={i.codigo}>
              <button type="button" role="option" aria-selected={i.codigo === idioma}
                className={"nav-idioma-item" + (i.codigo === idioma ? " ativo" : "")}
                onClick={() => { setIdioma(i.codigo); setAberto(false); }}>
                <span className="bandeira">{i.bandeira}</span> {i.nome}
                {i.codigo === idioma && <span className="check">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Barra de navegação no topo (sticky). Logo + abas + idioma + sessão.
const ABAS = [
  { href: "/", chave: "nav.inicio", icone: "◇" },
  { href: "/pedidos", chave: "nav.pedidos", icone: "▦" },
  { href: "/novo-pedido", chave: "nav.novoPedido", icone: "🧵" },
  { href: "/lucro", chave: "nav.lucro", icone: "📈" },
  { href: "/vendas", chave: "nav.vendas", icone: "💶" },
  { href: "/socios", chave: "nav.socios", icone: "🤝" },
  { href: "/despesas", chave: "nav.despesas", icone: "🧾" },
  { href: "/contas", chave: "nav.contas", icone: "🔑" },
  { href: "/definicoes", chave: "nav.definicoes", icone: "⚙️" },
];

export default function TopNav({ utilizador, onSair }) {
  const pathname = usePathname();
  const { t } = useIdioma();
  const ativo = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-marca">
          <span className="nav-marca-mark" aria-hidden="true" />
          ReSell<span className="ponto">.</span>
        </Link>

        <nav className="nav-abas">
          {ABAS.map((a) => (
            <Link key={a.href} href={a.href} className={"nav-aba" + (ativo(a.href) ? " ativa" : "")}>
              <span className="nav-icone">{a.icone}</span>
              <span className="nav-label">{t(a.chave)}</span>
            </Link>
          ))}
        </nav>

        <div className="nav-sessao">
          <SeletorIdioma />
          <span className="nav-user">{utilizador.nome}</span>
          <button className="btn mini" onClick={onSair}>{t("nav.sair")}</button>
        </div>
      </div>
    </header>
  );
}
