"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChefHat, ClipboardCheck, Copy, Hamburger, PackageCheck, RefreshCw, Truck, X } from "lucide-react";
import { money } from "@/domain/menu";
import type { OrderProgress } from "@/lib/order-tracking";
import "@/app/order-tracking.css";

const steps = [
  { status: "recebido", title: "Pedido recebido", description: "Seu pedido chegou! A equipe vai conferir e começar a preparar.", icon: ClipboardCheck },
  { status: "preparo", title: "Na chapa, com capricho", description: "Estamos preparando seu pedido. Cada camada, do seu jeito.", icon: ChefHat },
  { status: "entrega", title: "Saiu para entrega", description: "Seu pedido saiu da hamburgueria. Agora é só aguardar a chegada.", icon: Truck },
  { status: "concluido", title: "Pedido concluído", description: "A hamburgueria marcou seu pedido como concluído. Obrigado por escolher o Point!", icon: PackageCheck },
] as const;

export function OrderTracking({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderProgress | null>(null);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const refreshRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("acesso");
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      setUnavailable(true); setLoading(false); setError("Abra o link completo de acompanhamento recebido ao finalizar seu pedido."); return;
    }
    let disposed = false, inFlight = false, finished = false;
    let controller: AbortController | null = null;
    async function refresh(manual = false) {
      if (disposed || inFlight || (!manual && (finished || document.visibilityState === "hidden"))) return;
      inFlight = true;
      controller = new AbortController();
      setLoading(true);
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal, referrerPolicy: "no-referrer" });
        const data = await response.json() as OrderProgress & { error?: string };
        if (!response.ok) {
          if (response.status === 404) { finished = true; if (!disposed) { setUnavailable(true); setOrder(null); } }
          throw new Error(data.error || "Não foi possível atualizar seu pedido.");
        }
        if (!disposed) { setOrder(data); setError(""); setUnavailable(false); setCheckedAt(Date.now()); }
        finished = data.status === "concluido" || data.status === "cancelado";
      } catch (cause) {
        if (!disposed && !(cause instanceof Error && cause.name === "AbortError")) setError("Não conseguimos atualizar agora. " + (cause instanceof Error ? cause.message : "Confira sua conexão."));
      } finally { inFlight = false; if (!disposed) setLoading(false); }
    }
    refreshRef.current = () => void refresh(true);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const onOnline = () => void refresh();
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onOnline);
    return () => { disposed = true; controller?.abort(); window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("focus", onVisible); window.removeEventListener("online", onOnline); refreshRef.current = null; };
  }, [id]);

  const cancelled = order?.status === "cancelado";
  const active = Math.max(0, steps.findIndex(step => step.status === order?.status));
  const current = steps[active];
  const Icon = cancelled ? X : current.icon;
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopyMessage("Link copiado. Guarde para acompanhar seu pedido."); }
    catch { setCopyMessage("Copie o endereço completo na barra do navegador para guardar este acompanhamento."); }
  }
  return <div className="tracking-page">
    <header className="tracking-header"><a href="/" aria-label="Point do Hambúrguer, início" className="brand"><span className="brand-mark"><Hamburger size={25}/></span><span>point<span className="brand-small">DO HAMBÚRGUER</span></span></a><a href="/"><ArrowLeft size={16}/> Cardápio</a></header>
    <main className="tracking-main">
      <div className="tracking-intro"><span>DO NOSSO POINT ATÉ VOCÊ</span><h1>Acompanhe seu pedido.</h1><p>As novidades da hamburgueria aparecem por aqui.</p></div>
      {!order ? <section className="tracking-card tracking-empty" aria-live="polite"><span className="tracking-status-icon"><ClipboardCheck size={32}/></span><h2>{unavailable ? "Não encontramos este acompanhamento" : error ? "Vamos tentar de novo?" : "Buscando seu pedido…"}</h2><p>{error || "Só um instante. Estamos consultando a hamburgueria."}</p>{!unavailable && <button type="button" disabled={loading} onClick={()=>refreshRef.current?.()}><RefreshCw size={17}/> {loading ? "Consultando…" : "Tentar novamente"}</button>}<a href="/">Voltar ao cardápio <ArrowLeft size={16}/></a></section> : <>
        <section className={`tracking-card${cancelled ? " is-cancelled" : ""}`} aria-labelledby="tracking-status-title">
          <div className="tracking-order-heading"><div><span>SEU PEDIDO</span><strong>#{order.code}</strong></div><span className={`tracking-live${error ? " is-offline" : ""}`}><i/>{error ? "Sem atualização" : order.status === "concluido" || cancelled ? "Finalizado" : "Atualiza automaticamente"}</span></div>
          <div className="tracking-current" role="status" aria-live="polite" aria-atomic="true"><span className="tracking-status-icon"><Icon size={35}/></span><h2 id="tracking-status-title">{cancelled ? "Pedido cancelado" : current.title}</h2><p>{cancelled ? "A hamburgueria cancelou este pedido. Se precisar, entre em contato com a equipe." : current.description}</p></div>
          {!cancelled && <ol className="tracking-timeline" aria-label="Etapas do pedido">{steps.map((step,index)=><li key={step.status} className={index<active ? "is-done" : index===active ? "is-current" : ""} aria-current={index===active?"step":undefined}><span>{index<active?<Check size={17}/>:index+1}</span><strong>{["Recebido","Em preparo","Em entrega","Concluído"][index]}</strong></li>)}</ol>}
          <div className="tracking-totals"><div><span>Realizado em</span><strong>{new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Bahia",dateStyle:"short",timeStyle:"short"}).format(order.createdAt)}</strong></div><div><span>Total do pedido</span><strong>{money(order.total)}</strong></div></div>
          {error && <p className="tracking-warning" role="alert">{error} O status exibido é o da última consulta bem-sucedida.</p>}
          <div className="tracking-refresh"><span>{checkedAt ? `Última consulta às ${new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Bahia",hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(checkedAt)}` : ""}</span><button type="button" disabled={loading} onClick={()=>refreshRef.current?.()}><RefreshCw size={15}/>{loading?"Consultando…":"Atualizar"}</button></div>
        </section>
        <section className="tracking-save"><div><h2>Guarde seu acompanhamento</h2><p>Reabra este link para ver o status. Ele dá acesso ao acompanhamento deste pedido.</p></div><button type="button" onClick={()=>void copyLink()}><Copy size={17}/> Copiar link</button><p role="status">{copyMessage}</p></section>
      </>}
    </main><footer className="tracking-footer">Seu burger. Seu point.</footer>
  </div>;
}
