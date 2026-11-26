import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  title: "Point do Hambúrguer — Do seu jeito",
  description: "Monte seu hambúrguer, escolha cada ingrediente e faça seu pedido.",
  icons: {
    icon: "/icons/ph-favicon-v2.png",
    shortcut: "/icons/ph-favicon-v2.png",
    apple: "/icons/ph-apple-touch-v2.png",
  },
  appleWebApp: { capable: true, title: "Point", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#f36524" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
