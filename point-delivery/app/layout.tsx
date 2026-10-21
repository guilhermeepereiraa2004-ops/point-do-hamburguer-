import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Point do Hambúrguer — Do seu jeito",
  description: "Monte seu hambúrguer, escolha cada ingrediente e faça seu pedido.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
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
