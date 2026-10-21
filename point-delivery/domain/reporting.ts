import type { ManualEntry } from "./management";
export const businessTimeZone = "America/Bahia";
export const businessDate = (time: number) => new Intl.DateTimeFormat("en-CA", { timeZone: businessTimeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(time);
export function currentMonth(now = Date.now()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: businessTimeZone, year: "numeric", month: "numeric" }).formatToParts(now);
  const year = Number(parts.find(p => p.type === "year")!.value), month = Number(parts.find(p => p.type === "month")!.value);
  return { start: Date.UTC(year, month - 1, 1, 3), end: Date.UTC(year, month, 1, 3), label: new Intl.DateTimeFormat("pt-BR", { timeZone: businessTimeZone, month: "long", year: "numeric" }).format(now) };
}
export function inFinancialPeriod(date: number, period: string, month: { start: number; end: number }, now = Date.now()) {
  if (period === "todos") return true;
  if (period === "mes") return date >= month.start && date < month.end;
  const day = businessDate(date), today = businessDate(now);
  return period === "hoje" ? day === today : day >= businessDate(now - 6 * 86400000) && day <= today;
}
export type ReportOrder = { id: string; status: string; createdAt: number };
export type CompletedSale = { orderId: string; value: number; createdAt: number; customer: string; phone: string };
export function buildMonthlyReport(orders: ReportOrder[], sales: CompletedSale[], manual: ManualEntry[], now = Date.now()) {
  const month = currentMonth(now), inside = (date: number) => date >= month.start && date < month.end;
  const validOrders = orders.filter(o => o.status !== "cancelado" && inside(o.createdAt));
  const completed = sales.filter(s => inside(s.createdAt));
  const revenue = completed.reduce((sum, sale) => sum + sale.value, 0);
  const entries = manual.filter(entry => inside(entry.occurredAt));
  const income = entries.filter(e => e.type === "entrada").reduce((sum, e) => sum + e.value, 0);
  const expenses = entries.filter(e => e.type === "saida").reduce((sum, e) => sum + e.value, 0);
  const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map(label => ({ label, count: 0 }));
  validOrders.forEach(order => { const day = new Date(order.createdAt - 3 * 3600000).getUTCDay(); weekdays[(day + 6) % 7].count++; });
  const peak = Math.max(...weekdays.map(d => d.count));
  const customers = new Map<string, { name: string; count: number; value: number; lastSale: number }>();
  completed.forEach(sale => {
    const digits = sale.phone.replace(/\D/g, ""), identity = digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
    const customer = customers.get(identity) || { name: sale.customer, count: 0, value: 0, lastSale: 0 };
    customer.count++; customer.value += sale.value;
    if (sale.createdAt >= customer.lastSale) { customer.name = sale.customer; customer.lastSale = sale.createdAt; }
    customers.set(identity, customer);
  });
  const ranking = [...customers.values()].sort((a, b) => b.count - a.count || b.value - a.value || a.name.localeCompare(b.name, "pt-BR"));
  const leader = ranking[0];
  return { month, received: revenue + income, revenue, manualIncome: income, expenses, balance: revenue + income - expenses,
    averageTicket: completed.length ? Math.round(revenue / completed.length) : 0, orderCount: validOrders.length, completedCount: completed.length,
    weekdays, busiestDays: peak ? weekdays.filter(d => d.count === peak).map(d => d.label) : [], busiestCount: peak,
    topCustomer: leader ? { name: leader.name, count: leader.count, value: leader.value, tiedCustomers: ranking.filter(c => c.count === leader.count).length - 1 } : null };
}
export type MonthlyReport = ReturnType<typeof buildMonthlyReport>;
