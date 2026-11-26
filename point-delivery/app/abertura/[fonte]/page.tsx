import { notFound } from "next/navigation";
import Storefront from "@/components/storefront";
import { INTRO_FONTS, isIntroFont } from "@/components/intro-fonts";

export const dynamicParams = false;
export const metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return Object.keys(INTRO_FONTS).map(fonte => ({ fonte }));
}

export default async function FontPreview({ params }: { params: Promise<{ fonte: string }> }) {
  const { fonte } = await params;
  if (!isIntroFont(fonte)) notFound();
  return <Storefront introPreview introFont={fonte} />;
}
