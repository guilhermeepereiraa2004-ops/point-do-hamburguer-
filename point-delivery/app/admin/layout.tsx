import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Point Admin", statusBarStyle: "default" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
