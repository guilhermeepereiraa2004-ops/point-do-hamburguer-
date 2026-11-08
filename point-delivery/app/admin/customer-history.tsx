"use client";

import { useEffect, useState } from "react";
import { money, statusLabels } from "@/domain/menu";
import { businessTimeZone, type CustomerOrder, type CustomerProfile } from "@/domain/reporting";
import { AdminApiError, readAdminResponse } from "@/lib/admin-api-response";
import { ManagementDialog } from "./management-panels";
import { OrderContents } from "./order-contents";

const orderDate = new Intl.DateTimeFormat("pt-BR", { timeZone: businessTimeZone, dateStyle: "short", timeStyle: "short" });
const historyError = "Não foi possível carregar o histórico agora.";
type HistoryResult = { orders: CustomerOrder[] } | { error: string };

export function CustomerHistory({ customer, onClose }: { customer: CustomerProfile; onClose: () => void }) {
  const [result, setResult] = useState<HistoryResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { name, phone } = customer;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/admin", {
          method: "POST", redirect: "manual", cache: "no-store", signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "customer-history", phone }),
        });
        const payload = await readAdminResponse(response, historyError);
        if (!Array.isArray(payload.orders)) throw new Error(historyError);
        if (!controller.signal.aborted) setResult({ orders: payload.orders as CustomerOrder[] });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ error: error instanceof AdminApiError ? error.message : historyError });
      }
    }
    void load();
    return () => controller.abort();
  }, [phone, attempt]);

  return <ManagementDialog title={`Pedidos de ${name}`} closeLabel="Fechar histórico" busy={false} onClose={onClose}>
    {!result ? <p role="status">Carregando pedidos…</p> : "error" in result ? <>
      <p role="status">{result.error}</p>
      <button type="button" className="button primary" onClick={() => { setResult(null); setAttempt(value => value + 1); }}>Tentar novamente</button>
    </> : result.orders.length ? <ol className="customer-history-list">
      {result.orders.map(order => <li className="customer-history-order" key={order.id}>
        <header>
          <div><h3>Pedido #{order.code}</h3><time dateTime={new Date(order.createdAt).toISOString()}>{orderDate.format(order.createdAt)}</time></div>
          <div><strong>{money(order.total)}</strong><span className={`customer-history-status is-${order.status}`}>{statusLabels[order.status]}</span></div>
        </header>
        {order.items.length || order.burgers?.length ? <OrderContents order={order}/> : <p>Itens não registrados.</p>}
      </li>)}
    </ol> : <p role="status">Nenhum pedido encontrado para este cliente.</p>}
  </ManagementDialog>;
}
