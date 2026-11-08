import type { MetadataRoute } from "next";

export const dynamic = "force-static";
export function GET() {
  const manifest: MetadataRoute.Manifest = {
    id: "/",
    name: "Point do Hambúrguer",
    short_name: "Point",
    description: "Seu burger do seu jeito. Monte seu lanche e faça seu pedido.",
    lang: "pt-BR",
    start_url: "/#montar",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf5",
    theme_color: "#f36524",
    icons: [
      { src: "/icons/point-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/point-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/point-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return Response.json(manifest, { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } });
}
