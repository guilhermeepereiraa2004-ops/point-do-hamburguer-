"use client";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, CupSoda, DollarSign, Package, Pause, Pencil, Play, Plus, ShoppingBag, Star, Trophy, Users, X } from "lucide-react";
import { money, type Ingredient } from "@/domain/menu";
import { accompanimentTypes, type AccompanimentType, type ManualEntry } from "@/domain/management";
import { businessDate, inFinancialPeriod, type MonthlyReport } from "@/domain/reporting";

export type Receipt = { orderId: string; value: number; createdAt: number; customer: string; code: string };
type Mutation = (input: Record<string, unknown>) => Promise<string | null>;
const dateTime = (date: number) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Bahia", dateStyle: "short", timeStyle: "short" }).format(date);
const dateOnly = (date: number) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Bahia", dateStyle: "short" }).format(date);

function ManagementDialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input,select,textarea")?.focus();
    return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="modal-backdrop management-backdrop" onMouseDown={event => { if (!busy && event.target === event.currentTarget) onClose(); }}>
    <section ref={ref} className="management-modal" role="dialog" aria-modal="true" aria-labelledby="management-title" onKeyDown={event => {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key !== "Tab") return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <header><div><div className="eyebrow">GESTÃO DO SEU POINT</div><h2 id="management-title">{title}</h2></div><button type="button" aria-label="Fechar formulário" disabled={busy} onClick={onClose}><X size={20}/></button></header>
      {children}
    </section>
  </div>;
}

export function Overview({ report }: { report: MonthlyReport }) {
  const max = Math.max(1, ...report.weekdays.map(day => day.count));
  return <div className="overview">
    <div className="overview-period"><CalendarDays size={16}/><strong>{report.month.label}</strong><span>Mês atual · horário da Bahia</span></div>
    <div className="overview-metrics">
      <article className="metric-card featured"><span><DollarSign size={17}/> Recebido no mês</span><strong>{money(report.received)}</strong><small>{money(report.revenue)} em vendas + {money(report.manualIncome)} em entradas manuais</small></article>
      <article className="metric-card"><span><ShoppingBag size={17}/> Ticket médio das vendas</span><strong>{money(report.averageTicket)}</strong><small>{report.completedCount} pedido(s) concluído(s) no mês</small></article>
      <article className="metric-card"><span><Package size={17}/> Pedidos no mês</span><strong>{report.orderCount}</strong><small>Pedidos recebidos no mês, sem cancelados</small></article>
      <article className="metric-card"><span><ArrowUpRight size={17}/> Saldo do mês</span><strong className={report.balance < 0 ? "negative" : ""}>{money(report.balance)}</strong><small>Recebimentos menos {money(report.expenses)} em saídas</small></article>
    </div>
    <div className="overview-insights">
      <section className="insight-card"><span className="insight-icon"><CalendarDays size={21}/></span><div className="eyebrow">DIA DE MAIOR MOVIMENTO</div><h2>{report.busiestDays.length ? report.busiestDays.join(" / ") : "Ainda sem pedidos"}</h2><p>{report.busiestCount ? `${report.busiestCount} pedido(s) por dia da semana em destaque, no mês atual.${report.busiestDays.length > 1 ? " Há empate entre esses dias." : ""}` : "Os dias mais pedidos aparecem conforme os pedidos chegam."}</p><div className="weekday-chart" aria-label="Pedidos por dia da semana">{report.weekdays.map(day => <div key={day.label}><span>{day.label}</span><div className="weekday-track"><i style={{ width: `${day.count / max * 100}%` }}/></div><b>{day.count}</b></div>)}</div></section>
      <section className="insight-card customer-insight"><span className="insight-icon"><Trophy size={21}/></span><div className="eyebrow">CLIENTE QUE MAIS COMPROU</div><h2>{report.topCustomer?.name || "Seu próximo fã"}</h2><p>Por quantidade de pedidos concluídos no mês. Compras agrupadas pelo telefone.</p>{report.topCustomer ? <><div className="customer-numbers"><div><strong>{report.topCustomer.count}</strong><span>compras no mês</span></div><div><strong>{money(report.topCustomer.value)}</strong><span>em vendas concluídas</span></div></div>{report.topCustomer.tiedCustomers > 0 && <small className="insight-note">Mais {report.topCustomer.tiedCustomers} cliente(s) com a mesma quantidade de compras. Desempate pelo valor comprado.</small>}</> : <div className="insight-empty"><Users size={32}/><span>Conclua as primeiras vendas para conhecer seus clientes mais frequentes.</span></div>}<div className="insight-note">Entradas manuais não entram no ticket médio nem no ranking de clientes. Vendas são contabilizadas na data da conclusão.</div></section>
    </div>
  </div>;
}

function ManualFinanceForm({ busy, mutate, onClose }: { busy: boolean; mutate: Mutation; onClose: () => void }) {
  const [error, setError] = useState("");
  const id = useRef(crypto.randomUUID());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget);
    const result = await mutate({ kind: "manual-finance", id: id.current, type: data.get("type"), date: data.get("date"), description: data.get("description"), value: Math.round(Number(data.get("value")) * 100) });
    if (result) setError(result); else onClose();
  }
  return <ManagementDialog title="Novo lançamento" busy={busy} onClose={onClose}><form onSubmit={submit}>
    <p className="management-intro">Registre uma entrada ou saída do caixa. As receitas dos pedidos continuam automáticas.</p>
    <div className="management-form-row"><label>Tipo<select name="type" required><option value="entrada">Entrada</option><option value="saida">Saída</option></select></label><label>Data<input name="date" type="date" defaultValue={businessDate(Date.now())} min="2000-01-01" max={businessDate(Date.now())} required/></label></div>
    <label>Descrição<input name="description" placeholder="Ex.: compra de embalagens" maxLength={200} required/></label>
    <label>Valor em reais<input name="value" type="number" inputMode="decimal" min="0.01" max="10000" step="0.01" placeholder="0,00" required/></label>
    {error && <p className="notice error" role="alert">{error}</p>}<button className="button primary management-submit" disabled={busy}>{busy ? "Registrando…" : "Registrar lançamento"}<Check size={16}/></button>
  </form></ManagementDialog>;
}

export function FinanceView({ receipts, manual, month, busy, mutate }: { receipts: Receipt[]; manual: ManualEntry[]; month: MonthlyReport["month"]; busy: boolean; mutate: Mutation }) {
  const [period, setPeriod] = useState("mes"), [showForm, setShowForm] = useState(false);
  const now = Date.now();
  const inside = (date: number) => inFinancialPeriod(date, period, month, now);
  const sales = receipts.filter(receipt => inside(receipt.createdAt)), entries = manual.filter(entry => inside(entry.occurredAt));
  const revenue = sales.reduce((sum, sale) => sum + sale.value, 0), manualIncome = entries.filter(e => e.type === "entrada").reduce((sum, e) => sum + e.value, 0), expenses = entries.filter(e => e.type === "saida").reduce((sum, e) => sum + e.value, 0);
  const rows = [...sales.map(sale => ({ id: `order-${sale.orderId}`, date: sale.createdAt, label: `Pedido #${sale.code}`, detail: sale.customer, origin: "Venda concluída", value: sale.value, type: "entrada" })), ...entries.map(entry => ({ id: entry.id, date: entry.occurredAt, label: entry.description, detail: "Lançamento manual", origin: "Manual", value: entry.value, type: entry.type }))].sort((a, b) => b.date - a.date || a.id.localeCompare(b.id));
  return <><div className="admin-section-top management-section-top"><div><h2>Entradas e saídas</h2><p>Vendas concluídas e movimentações manuais do caixa.</p></div><div className="management-actions"><select aria-label="Filtrar período financeiro" value={period} onChange={e => setPeriod(e.target.value)}><option value="mes">Mês atual</option><option value="hoje">Hoje</option><option value="semana">Últimos 7 dias</option><option value="todos">Todo o período</option></select><button className="button primary" onClick={() => setShowForm(true)}><Plus size={16}/> Novo lançamento</button></div></div>
    <div className="overview-metrics finance-metrics"><article className="metric-card"><span><ArrowDownLeft size={17}/> Entradas</span><strong>{money(revenue + manualIncome)}</strong><small>Vendas: {money(revenue)} · Manuais: {money(manualIncome)}</small></article><article className="metric-card"><span><ArrowUpRight size={17}/> Saídas</span><strong>{money(expenses)}</strong><small>Saídas manuais no período</small></article><article className="metric-card featured"><span><DollarSign size={17}/> Saldo do período</span><strong>{money(revenue + manualIncome - expenses)}</strong><small>Entradas menos saídas</small></article></div>
    <div className="table-scroll"><table className="admin-table finance-ledger"><thead><tr><th>Data</th><th>Descrição</th><th>Origem</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.origin === "Manual" ? dateOnly(row.date) : dateTime(row.date)}</td><td><strong>{row.label}</strong><small>{row.detail}</small></td><td>{row.origin}</td><td><span className={`ledger-type ${row.type}`}>{row.type === "entrada" ? "Entrada" : "Saída"}</span></td><td><strong className={row.type === "entrada" ? "positive" : "negative"}>{row.type === "entrada" ? "+" : "−"} {money(row.value)}</strong></td></tr>)}{!rows.length && <tr><td colSpan={5} className="empty-table">Nenhuma movimentação neste período.</td></tr>}</tbody></table></div>
    {showForm && <ManualFinanceForm busy={busy} mutate={mutate} onClose={() => setShowForm(false)}/>}
  </>;
}

function ProductForm({ item, busy, mutate, onClose }: { item: Ingredient | null; busy: boolean; mutate: Mutation; onClose: () => void }) {
  const [type, setType] = useState<AccompanimentType>((item?.extraType as AccompanimentType) || "refrigerante"), [error, setError] = useState("");
  const id = useRef(item?.id || crypto.randomUUID());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result = await mutate({ kind: "accompaniment", create: !item, id: id.current, extraType: type, productName: values.productName, flavor: values.flavor || "", size: values.size, description: values.description || "", price: Math.round(Number(values.price) * 100), lowStock: Number(values.lowStock), maxQty: Number(values.maxQty), ...(!item ? { stock: Number(values.stock) } : {}) });
    if (result) setError(result); else onClose();
  }
  return <ManagementDialog title={item ? "Editar produto" : "Novo produto"} busy={busy} onClose={onClose}><form onSubmit={submit}>
    <p className="management-intro">Cada produto tem seu preço e estoque. Depois de salvar, use a estrela para exibi-lo nos acompanhamentos.</p>
    <label>Categoria<select value={type} onChange={e => setType(e.target.value as AccompanimentType)}>{Object.entries(accompanimentTypes).map(([value, name]) => <option value={value} key={value}>{name}</option>)}</select></label>
    <label>Nome ou marca<input name="productName" defaultValue={item?.productName || item?.name || ""} placeholder={type === "batata-frita" ? "Ex.: Batata frita" : type === "outros" ? "Ex.: nome do produto" : "Ex.: nome da bebida"} maxLength={70} required/></label>
    <div className="management-form-row">{["refrigerante", "suco"].includes(type) && <label>Sabor<input name="flavor" defaultValue={item?.flavor || ""} placeholder="Ex.: uva, laranja, cola" maxLength={60} required/></label>}<label>{["refrigerante", "suco"].includes(type) ? "Tamanho / embalagem" : "Tamanho / porção"}<input name="size" defaultValue={item?.size || ""} placeholder={type === "batata-frita" ? "Ex.: 300 g" : type === "outros" ? "Ex.: unidade, pacote ou porção" : "Ex.: 1 L, 2 L, 500 ml, lata 350 ml"} maxLength={40} required/></label></div>
    <label>Descrição / coberturas<input name="description" defaultValue={item?.description || ""} placeholder="Ex.: bacon e queijo ralado" maxLength={200}/></label>
    <div className="management-form-row"><label>Preço em reais<input name="price" type="number" inputMode="decimal" min="0.01" max="10000" step="0.01" defaultValue={item?.price == null ? "" : item.price / 100} required/></label>{!item && <label>Estoque inicial<input name="stock" type="number" min="0" max="1000000" step="1" defaultValue="0" required/></label>}</div>
    <div className="management-form-row"><label>Alertar quando restarem<input name="lowStock" type="number" min="0" max="1000000" step="1" defaultValue={item?.lowStock ?? 5} required/></label><label>Limite por pedido<input name="maxQty" type="number" min="1" max="99" step="1" defaultValue={item?.maxQty ?? 4} required/></label></div>
    {item && <p className="management-intro">Saldo atual: {item.stock} {item.unit}(s). Use “Ajustar estoque” na lista para registrar uma reposição.</p>}
    {error && <p className="notice error" role="alert">{error}</p>}<button className="button primary management-submit" disabled={busy}>{busy ? "Salvando…" : item ? "Salvar produto" : "Cadastrar produto"}<Check size={16}/></button>
  </form></ManagementDialog>;
}

export function ProductCatalogView({ items, busy, mutate, adjustStock }: { items: Ingredient[]; busy: boolean; mutate: Mutation; adjustStock: (item: Ingredient) => void }) {
  const [filter, setFilter] = useState("todos"), [form, setForm] = useState<{ item: Ingredient | null } | null>(null);
  const filtered = items.filter(item => filter === "todos" || (filter === "featured" ? item.featured : item.extraType === filter));
  const featuredCount = items.filter(item => item.featured).length;
  return <><div className="admin-section-top management-section-top"><div><h2>Produtos do cardápio</h2><p>Marque a estrela para mostrar o produto em Acompanhamentos no pedido do cliente.</p></div><button className="button primary" onClick={() => setForm({ item: null })}><Plus size={16}/> Novo produto</button></div>
    <div className="menu-featured-legend"><Star size={16} fill="currentColor"/><span><strong>{featuredCount}</strong> de {items.length} produtos nos acompanhamentos</span></div>
    <div className="management-filters" role="group" aria-label="Filtrar produtos">{[["todos", "Todos"], ["featured", "Acompanhamentos"], ...Object.entries(accompanimentTypes)].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === "featured" && <Star size={13}/>} {label}</button>)}</div>
    <div className="accompaniments-grid">{filtered.map(item => <article className="accompaniment-card" key={item.id}>
      <div className="accompaniment-top"><span className="accompaniment-icon">{["batata-frita", "outros"].includes(item.extraType || "") ? <Package size={25}/> : <CupSoda size={25}/>}</span><div className="product-card-controls"><span className={`stock-tag ${!item.active ? "paused" : !item.stock ? "empty" : item.price === null ? "pending" : item.stock <= item.lowStock ? "low" : ""}`}>{!item.active ? "Pausado" : !item.stock ? "Sem estoque" : item.price === null ? "Preço pendente" : item.stock <= item.lowStock ? "Estoque baixo" : "Disponível"}</span><button type="button" className={`product-featured ${item.featured ? "is-featured" : ""}`} disabled={busy} aria-pressed={Boolean(item.featured)} aria-label={`${item.featured ? "Retirar dos" : "Exibir nos"} acompanhamentos: ${item.name}`} title={item.featured ? "Retirar dos acompanhamentos" : "Exibir nos acompanhamentos"} onClick={() => void mutate({ kind: "featured", id: item.id, value: !item.featured })}><Star size={19} fill={item.featured ? "currentColor" : "none"}/></button></div></div>
      <small className="accompaniment-category">{accompanimentTypes[item.extraType as AccompanimentType] || "Produto"}</small><h3>{item.productName || item.name}</h3><p>{[item.description, item.flavor, item.size].filter(Boolean).join(" · ") || "Configure os detalhes e o preço deste produto."}</p>
      <span className={`product-placement ${item.featured ? "is-featured" : ""}`}><Star size={12} fill={item.featured ? "currentColor" : "none"}/>{item.featured ? "Em acompanhamentos" : "Fora de acompanhamentos"}</span>
      <div className="accompaniment-values"><strong>{item.price === null ? "A configurar" : money(item.price)}</strong><span><Package size={13}/><b>{item.stock}</b> {item.unit}(s)</span></div><div className="accompaniment-actions"><button className="table-edit" disabled={busy} aria-label={`Editar ${item.name}`} onClick={() => setForm({ item })}><Pencil size={13}/> Editar</button><button className="table-edit" disabled={busy} aria-label={`Ajustar estoque de ${item.name}`} onClick={() => adjustStock(item)}><Plus size={13}/> Ajustar estoque</button><button className="availability-action" disabled={busy} aria-label={`${item.active ? "Pausar" : "Liberar"} ${item.name}`} onClick={() => void mutate({ kind: "availability", id: item.id, value: !item.active })}>{item.active ? <Pause size={13}/> : <Play size={13}/>} {item.active ? "Pausar" : "Liberar"}</button></div>
    </article>)}</div>
    {!filtered.length && <div className="admin-empty"><CupSoda size={32}/><h3>{filter === "featured" ? "Escolha seus acompanhamentos." : "Novos produtos por aqui."}</h3><p>{filter === "featured" ? "Marque a estrela nos produtos que deseja exibir ao cliente." : "Cadastre produtos com nome, tamanho, preço e quantidade disponível."}</p></div>}
    {form && <ProductForm item={form.item} busy={busy} mutate={mutate} onClose={() => setForm(null)}/>}
  </>;
}
