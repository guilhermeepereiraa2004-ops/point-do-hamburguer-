import type { Metadata } from "next";
import { OrderTracking } from "@/components/order-tracking";

export const metadata: Metadata = { title: "Acompanhe seu pedido — Point do Hambúrguer", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderTracking id={id}/>;
}
