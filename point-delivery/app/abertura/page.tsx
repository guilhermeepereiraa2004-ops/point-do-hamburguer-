import Storefront from "@/components/storefront";

export const metadata = { robots: { index: false, follow: false } };

export default function OpeningPreview() {
  return <Storefront introPreview />;
}
