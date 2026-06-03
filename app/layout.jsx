import "./globals.css";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import RegistarSW from "./components/RegistarSW";
import { IdiomaProvider } from "./components/Idioma";
import { ehIdioma, IDIOMA_PADRAO } from "@/lib/i18n";

// Fontes self-hosted (servidas pela própria app — rápidas e funcionam offline).
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "ReSell · tracker de revenda",
  description:
    "App para gerir uma operação de revenda: custo real, margem, lucro e dias até vender.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ReSell" },
};

export const viewport = {
  themeColor: "#0E1116",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  const cookieIdioma = cookies().get("idioma")?.value;
  const idioma = ehIdioma(cookieIdioma) ? cookieIdioma : IDIOMA_PADRAO;

  return (
    <html lang={idioma} className={`${archivo.variable} ${jetbrains.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        <IdiomaProvider inicial={idioma}>{children}</IdiomaProvider>
        <RegistarSW />
      </body>
    </html>
  );
}
