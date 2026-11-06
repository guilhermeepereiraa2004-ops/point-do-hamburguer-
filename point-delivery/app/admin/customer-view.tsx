"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { money } from "@/domain/menu";
import { normalizeCustomerName, normalizeCustomerPhone, type CustomerProfile } from "@/domain/reporting";
import { CustomerHistory } from "./customer-history";
import "./customer-view.css";

export function CustomerView({ customers }: { customers: CustomerProfile[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerProfile | null>(null);
  const nameQuery = normalizeCustomerName(search);
  const phoneQuery = /^[+\d().\s-]+$/.test(search) ? normalizeCustomerPhone(search) : "";
  const visible = customers.filter(customer => normalizeCustomerName(customer.name).includes(nameQuery) ||
    (phoneQuery && normalizeCustomerPhone(customer.phone).includes(phoneQuery)));

  return <section className="customer-view" aria-label="Histórico de clientes">
    <div className="customer-toolbar">
      <label className="admin-search">Buscar cliente
        <input type="search" placeholder="Nome ou telefone" value={search} onChange={event => setSearch(event.target.value)}/>
      </label>
      <span role="status">{visible.length} {visible.length === 1 ? "cliente" : "clientes"}</span>
    </div>
    {visible.length > 0 ? <ul className="customer-list">
      {visible.map(customer => <li className="customer-card" key={customer.id}>
        <header className="customer-card-header">
          <h2>{customer.name}</h2>
          <span className="customer-order-count">{customer.orderCount} {customer.orderCount === 1 ? "pedido concluído" : "pedidos concluídos"}</span>
        </header>
        <dl>
          <div className="customer-phone"><dt>Telefone</dt><dd>{customer.phone}</dd></div>
          <div className="customer-spent"><dt>Total gasto</dt><dd>{money(customer.spent)}</dd></div>
          <div className="customer-address"><dt>Endereço da última compra</dt><dd>{customer.address}</dd></div>
        </dl>
        <button className="customer-history-open" type="button" aria-haspopup="dialog"
          aria-label={`Ver histórico de ${customer.name}`} onClick={event => {
            event.currentTarget.focus({ preventScroll: true });
            setSelected(customer);
          }}>
          Ver histórico <ChevronRight size={16} aria-hidden="true"/>
        </button>
      </li>)}
    </ul> : <p className="admin-search-empty">
      {customers.length ? "Nenhum cliente encontrado." : "Os clientes aparecem aqui após o primeiro pedido concluído."}
    </p>}
    {selected && <CustomerHistory key={selected.id} customer={selected} onClose={() => setSelected(null)}/>}
  </section>;
}
