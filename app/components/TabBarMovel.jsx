"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdioma } from "./Idioma";
import SeletorIdioma from "./SeletorIdioma";
import Icone from "./Icones";

// Shell móvel (<900px): cabeçalho fino no topo (marca + idioma + sair) e uma
// barra de abas fixa em baixo, estilo app nativa. As 5 secções principais têm
// aba própria; o resto vive na folha "Mais".
const PRINCIPAIS = [
  { href: "/", id: "inicio", chave: "nav.inicio" },
  { href: "/pedidos", id: "pedidos", chave: "nav.pedidos" },
  { href: "/novo-pedido", id: "novo-pedido", chave: "nav.novoPedido" },
  { href: "/lucro", id: "lucro", chave: "nav.lucro" },
  { href: "/vendas", id: "vendas", chave: "nav.vendas" },
];
const NO_MAIS = [
  { href: "/socios", id: "socios", chave: "nav.socios" },
  { href: "/despesas", id: "despesas", chave: "nav.despesas" },
  { href: "/contas", id: "contas", chave: "nav.contas" },
  { href: "/definicoes", id: "definicoes", chave: "nav.definicoes" },
];

export default function TabBarMovel({ onSair }) {
  const pathname = usePathname();
  const { t } = useIdioma();
  const [maisAberto, setMaisAberto] = useState(false);

  const ativo = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const maisAtivo = NO_MAIS.some((i) => ativo(i.href));

  // A folha fecha ao navegar e no Escape.
  useEffect(() => { setMaisAberto(false); }, [pathname]);
  useEffect(() => {
    if (!maisAberto) return;
    const esc = (e) => { if (e.key === "Escape") setMaisAberto(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [maisAberto]);

  return (
    <>
      <header className="mheader">
        <Link href="/" className="nav-marca mh-marca">
          <span className="nav-marca-mark" aria-hidden="true" />
          ReSell<span className="ponto">.</span>
        </Link>
        <div className="mh-acoes">
          <SeletorIdioma />
          <button className="btn mini" onClick={onSair}>{t("nav.sair")}</button>
        </div>
      </header>

      {maisAberto && <div className="msheet-fundo" onClick={() => setMaisAberto(false)} />}
      {maisAberto && (
        <div className="msheet" role="menu">
          {NO_MAIS.map((item) => (
            <Link key={item.href} href={item.href} role="menuitem"
              className={"msheet-item" + (ativo(item.href) ? " ativo" : "")}>
              <Icone id={item.id} size={19} />
              {t(item.chave)}
            </Link>
          ))}
        </div>
      )}

      <nav className="tabbar" aria-label={t("nav.inicio")}>
        {PRINCIPAIS.map((item) => (
          <Link key={item.href} href={item.href}
            className={"tab" + (ativo(item.href) ? " ativo" : "")}
            aria-current={ativo(item.href) ? "page" : undefined}>
            <Icone id={item.id} size={21} />
            <span>{t(item.chave)}</span>
          </Link>
        ))}
        <button type="button"
          className={"tab" + (maisAtivo || maisAberto ? " ativo" : "")}
          aria-expanded={maisAberto}
          onClick={() => setMaisAberto((v) => !v)}>
          <Icone id="mais" size={21} />
          <span>{t("nav.mais")}</span>
        </button>
      </nav>
    </>
  );
}
