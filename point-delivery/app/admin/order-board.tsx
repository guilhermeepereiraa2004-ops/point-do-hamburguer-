"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowRight, ChevronDown, ClipboardList, CreditCard, GripVertical } from "lucide-react";
import { paymentLabel } from "@/domain/payment";
import { money, statusLabels, type Order, type Status } from "@/domain/menu";
import { OrderContents } from "./order-contents";
import "./order-board.css";

const stages = ["recebido", "preparo", "entrega", "concluido"] as const;
type Stage = typeof stages[number];
const nextStage: Partial<Record<Status, Stage>> = { recebido: "preparo", preparo: "entrega", entrega: "concluido" };
const actionLabel: Partial<Record<Status, string>> = { recebido: "Aceitar e preparar", preparo: "Saiu para entrega", entrega: "Concluir pedido" };
const shortLabel: Record<Stage, string> = { recebido: "Recebidos", preparo: "Preparo", entrega: "Entrega", concluido: "Concluídos" };
const dates = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Bahia", dateStyle: "short", timeStyle: "short" });

type BoardProps = {
  orders: Order[];
  busy: boolean;
  onAdvance: (order: Order, destination: Stage) => Promise<boolean>;
  onCancel: (order: Order) => void;
};

function OrderCard({ order, busy, dragging, grip, onAdvance, onCancel }: {
  order: Order; busy: boolean; dragging: boolean;
  grip: {
    start: (event: PointerEvent<HTMLElement>, order: Order) => void;
    move: (event: PointerEvent<HTMLElement>) => void;
    end: (event: PointerEvent<HTMLElement>) => void;
    cancel: () => void;
  };
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const next = nextStage[order.status];
  return <article className={`order-card board-card${dragging ? " is-dragging" : ""}`} aria-label={`Pedido #${order.code}`}>
    <div className="board-card-top">
      <div><h3>#{order.code}</h3><time dateTime={new Date(order.createdAt).toISOString()}>{dates.format(order.createdAt)}</time></div>
      {next && <span className="board-drag-handle" title="Arrastar para a próxima etapa" aria-hidden="true"
        onPointerDown={event => grip.start(event, order)} onPointerMove={grip.move} onPointerUp={grip.end} onPointerCancel={grip.cancel} onLostPointerCapture={grip.cancel}>
        <GripVertical size={19} aria-hidden="true"/>
      </span>}
    </div>
    <div className="board-card-customer"><h4>{order.customer}</h4><strong>{money(order.total)}</strong></div>
    <p className="board-card-payment"><CreditCard size={15} aria-hidden="true"/><span>{paymentLabel(order.paymentMethod)}</span></p>
    <details className="board-card-details">
      <summary>Detalhes do pedido <ChevronDown size={16} aria-hidden="true"/></summary>
      <a href={`tel:${order.phone}`}>{order.phone}</a>
      <OrderContents order={order}/>
      <div className="order-address"><strong>Entrega · {money(order.deliveryFee)}</strong><p>{order.address}</p><small>Referência: {order.reference}</small>{order.notes && <p className="order-note">Obs.: {order.notes}</p>}</div>
      {next && <button type="button" className="board-cancel" disabled={busy} onClick={onCancel}>Cancelar pedido</button>}
    </details>
    {next && <button type="button" className="button primary board-advance" disabled={busy} onClick={onAdvance}>
      {actionLabel[order.status]} <ArrowRight size={15} aria-hidden="true"/>
    </button>}
  </article>;
}

export function OrderBoard({ orders, busy, onAdvance, onCancel }: BoardProps) {
  const [selected, setSelected] = useState<Stage>("recebido");
  const [history, setHistory] = useState(false);
  const [drag, setDrag] = useState<{ id: string; status: Status } | null>(null);
  const [hovered, setHovered] = useState<Stage | null>(null);
  const gesture = useRef<{ id: string; status: Status; pointer: number; x: number; y: number; moving: boolean } | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const dragged = drag && orders.find(order => order.id === drag.id && order.status === drag.status);
  const destination = !busy && dragged ? nextStage[dragged.status] : undefined;
  const byStatus: Record<Status, Order[]> = { recebido: [], preparo: [], entrega: [], concluido: [], cancelado: [] };
  for (const order of orders) byStatus[order.status]?.push(order);

  useEffect(() => {
    if (!drag) return;
    function cancelOnEscape(event: KeyboardEvent) { if (event.key === "Escape") cancelDrag(); }
    window.addEventListener("keydown", cancelOnEscape);
    return () => window.removeEventListener("keydown", cancelOnEscape);
  }, [drag]);

  function cancelDrag() { gesture.current = null; setDrag(null); setHovered(null); }
  function startDrag(event: PointerEvent<HTMLElement>, order: Order) {
    if (busy || !nextStage[order.status] || event.button !== 0 || event.pointerType === "touch" || gesture.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { id: order.id, status: order.status, pointer: event.pointerId, x: event.clientX, y: event.clientY, moving: false };
  }
  function stageAt(event: PointerEvent<HTMLElement>) {
    return document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(".board-column")?.dataset.stage;
  }
  function moveDrag(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.pointer !== event.pointerId) return;
    if (!current.moving) {
      if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < 6) return;
      current.moving = true;
      setDrag({ id: current.id, status: current.status });
    }
    if (preview.current) preview.current.style.transform = `translate3d(${event.clientX + 12}px, ${event.clientY + 14}px, 0)`;
    const next = nextStage[current.status];
    const target = next && stageAt(event) === next ? next : null;
    if (hovered !== target) setHovered(target);
  }
  async function advance(order: Order, target: Stage) {
    if (busy || nextStage[order.status] !== target) return;
    if (await onAdvance(order, target)) {
      setSelected(target);
      if (window.matchMedia("(max-width: 1180px), (pointer: coarse)").matches) {
        window.requestAnimationFrame(() => document.getElementById(`board-stage-button-${target}`)?.focus());
      }
    }
  }
  function finishDrag(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.pointer !== event.pointerId) return;
    const target = stageAt(event);
    cancelDrag();
    if (!current.moving || busy) return;
    const order = orders.find(item => item.id === current.id && item.status === current.status);
    const next = order && nextStage[order.status];
    if (order && next && target === next) void advance(order, next);
  }
  function renderCard(order: Order) {
    return <OrderCard key={order.id} order={order} busy={busy} dragging={order.id === dragged?.id} grip={{ start: startDrag, move: moveDrag, end: finishDrag, cancel: cancelDrag }}
      onAdvance={() => { const next = nextStage[order.status]; if (next) void advance(order, next); }} onCancel={() => onCancel(order)}/>;
  }

  return <section className="order-board" aria-labelledby="order-board-title">
    <div ref={preview} className="board-drag-preview" aria-hidden="true" hidden={!dragged}>Pedido #{dragged?.code}</div>
    <header className="board-toolbar">
      <div><h2 id="order-board-title">Quadro de pedidos</h2><p className="board-desktop-help">Arraste o cartão pela alça até a próxima etapa.</p><p className="board-mobile-help">Escolha uma etapa e toque no botão do pedido para avançar.</p></div>
      <div className="board-view-switch" role="group" aria-label="Exibição dos pedidos">
        <button type="button" aria-pressed={!history} onClick={() => setHistory(false)}>Fluxo</button>
        <button type="button" aria-pressed={history} onClick={() => setHistory(true)}>Cancelados <b>{byStatus.cancelado.length}</b></button>
      </div>
    </header>
    {history ? <div className="board-cancelled">
      {byStatus.cancelado.length ? byStatus.cancelado.map(renderCard) : <p className="board-empty">Nenhum pedido cancelado.</p>}
    </div> : <>
      <div className="board-stage-switch" role="group" aria-label="Etapa dos pedidos">
        {stages.map(stage => <button type="button" key={stage} id={`board-stage-button-${stage}`} aria-pressed={selected === stage} onClick={() => setSelected(stage)}>
          {shortLabel[stage]} <b>{byStatus[stage].length}</b>
        </button>)}
      </div>
      <div className="board-columns">
        {stages.map(stage => <section key={stage} aria-labelledby={`board-column-${stage}`} data-stage={stage}
          className={`board-column${selected === stage ? " is-selected" : ""}${destination === stage ? " is-drop-target" : ""}${destination === stage && hovered === stage ? " is-over" : ""}`}>
          <header className="board-column-heading"><i aria-hidden="true"/><h3 id={`board-column-${stage}`}>{statusLabels[stage]}</h3><b>{byStatus[stage].length}</b></header>
          {destination === stage && <p className="board-drop-label">Solte para avançar o pedido</p>}
          <div className="board-column-cards">
            {byStatus[stage].length ? byStatus[stage].map(renderCard) : <p className="board-empty"><ClipboardList size={19} aria-hidden="true"/> Nenhum pedido nesta etapa.</p>}
          </div>
        </section>)}
      </div>
    </>}
  </section>;
}
