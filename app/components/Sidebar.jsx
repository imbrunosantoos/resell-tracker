"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdioma } from "./Idioma";
import SeletorIdioma from "./SeletorIdioma";
import Icone from "./Icones";

// Sidebar do desktop: marca, navegação agrupada por secção e sessão no rodapé.
// O item ativo pinta-se com a cor da página (via --cor-pagina do wrapper).
const GRUPOS = [
  { chave: "navsec.visao", itens: [
    { href: "/", id: "inicio", chave: "nav.inicio" },
  ]},
  { chave: "navsec.operacao", itens: [
    { href: "/pedidos", id: "pedidos", chave: "nav.pedidos" },
    { href: "/novo-pedido", id: "novo-pedido", chave: "nav.novoPedido" },
  ]},
  { chave: "navsec.financas", itens: [
    { href: "/lucro", id: "lucro", chave: "nav.lucro" },
    { href: "/vendas", id: "vendas", chave: "nav.vendas" },
    { href: "/despesas", id: "despesas", chave: "nav.despesas" },
  ]},
  { chave: "navsec.pessoas", itens: [
    { href: "/socios", id: "socios", chave: "nav.socios" },
  ]},
  { chave: "navsec.sistema", itens: [
    { href: "/contas", id: "contas", chave: "nav.contas" },
    { href: "/definicoes", id: "definicoes", chave: "nav.definicoes" },
  ]},
];

export default function Sidebar({ utilizador, onSair }) {
  const pathname = usePathname();
  const { t } = useIdioma();
  const ativo = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const inicial = (utilizador.nome || "?").trim().charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <Link href="/" className="nav-marca sb-marca">
        <span className="nav-marca-mark" aria-hidden="true" />
        ReSell<span className="ponto">.</span>
      </Link>

      <nav className="sb-nav">
        {GRUPOS.map((g) => (
          <div className="sb-grupo" key={g.chave}>
            <span className="sb-grupo-rotulo">{t(g.chave)}</span>
            {g.itens.map((item) => (
              <Link
                key={item.href} href={item.href}
                className={"sb-item" + (ativo(item.href) ? " ativo" : "")}
                aria-current={ativo(item.href) ? "page" : undefined}
              >
                <Icone id={item.id} size={18} />
                <span>{t(item.chave)}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-fundo">
        <div className="sb-sessao">
          <span className="sb-avatar" aria-hidden="true">{inicial}</span>
          <span className="sb-nome">{utilizador.nome}</span>
        </div>
        <div className="sb-acoes">
          <SeletorIdioma />
          <button className="btn mini sb-sair" onClick={onSair}>
            <Icone id="sair" size={14} /> {t("nav.sair")}
          </button>
        </div>
      </div>
    </aside>
  );
}
