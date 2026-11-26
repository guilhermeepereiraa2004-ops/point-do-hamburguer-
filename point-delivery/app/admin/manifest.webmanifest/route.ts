import type { MetadataRoute } from "next";

export function GET() {
  const manifest: MetadataRoute.Manifest = {
    id: "/admin",
    name: "Point do Hambúrguer — Admin",
    short_name: "Point Admin",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#f5f6f9",
    theme_color: "#f36524",
    icons: [
      { src: "/icons/ph-192-v2.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/ph-512-v2.png", sizes: "512x512", type: "image/png" },
    ],
  };
  return Response.json(manifest, {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
