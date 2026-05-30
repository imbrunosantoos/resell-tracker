import "./globals.css";
import { Archivo, JetBrains_Mono } from "next/font/google";
import RegistarSW from "./components/RegistarSW";

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
  return (
    <html lang="pt" className={`${archivo.variable} ${jetbrains.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        {children}
        <RegistarSW />
      </body>
    </html>
  );
}
