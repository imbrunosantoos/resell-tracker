"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra de navegação no topo (sticky). Logo + abas + sessão.
const ABAS = [
  { href: "/", label: "Início", icone: "◇" },
  { href: "/pedidos", label: "Pedidos", icone: "▦" },
  { href: "/lucro", label: "Lucro", icone: "📈" },
  { href: "/despesas", label: "Despesas", icone: "🧾" },
  { href: "/contas", label: "Contas", icone: "🔑" },
  { href: "/definicoes", label: "Definições", icone: "⚙️" },
];

export default function TopNav({ utilizador, onSair }) {
  const pathname = usePathname();
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
              <span className="nav-label">{a.label}</span>
            </Link>
          ))}
        </nav>

        <div className="nav-sessao">
          <span className="nav-user">{utilizador.nome}</span>
          <button className="btn mini" onClick={onSair}>Sair</button>
        </div>
      </div>
    </header>
  );
}
