import { NextResponse } from "next/server";

// Gate leve: sem cookie de sessão, qualquer página/endpoint protegido salta
// para /login. A validação a sério (o token existir mesmo na BD) acontece nas
// rotas e na página, porque o middleware corre no edge e não fala com o SQLite.
export function middleware(request) {
  const temCookie = Boolean(request.cookies.get("resell_sessao")?.value);
  if (!temCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Aplica a tudo menos: /login, as rotas de auth, estáticos do Next e ficheiros
// públicos (manifest, service worker, ícones).
export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon.svg|icons).*)",
  ],
};
