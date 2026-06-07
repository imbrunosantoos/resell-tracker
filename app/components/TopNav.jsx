"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdioma } from "./Idioma";
import { IDIOMAS } from "@/lib/i18n";

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
  const { t, idioma, setIdioma } = useIdioma();
  const ativo = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-marca">
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
          <label className="nav-idioma" title={t("idioma.label")}>
            <span aria-hidden="true">🌐</span>
            <select value={idioma} onChange={(e) => setIdioma(e.target.value)} aria-label={t("idioma.label")}>
              {IDIOMAS.map((i) => (
                <option key={i.codigo} value={i.codigo}>{i.codigo.toUpperCase()}</option>
              ))}
            </select>
          </label>
          <span className="nav-user">{utilizador.nome}</span>
          <button className="btn mini" onClick={onSair}>{t("nav.sair")}</button>
        </div>
      </div>
    </header>
  );
}
