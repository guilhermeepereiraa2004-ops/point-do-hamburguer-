import { BrandLogo } from "./brand-logo";
import "@/app/floating-order-bag.css";

export function FloatingOrderBag({ count, disabled, onOpen }: { count: number; disabled: boolean; onOpen: () => void }) {
  const quantity = `${count} ${count === 1 ? "item" : "itens"}`;
  return <button type="button" className="floating-order-bag" onClick={onOpen} disabled={disabled} aria-label={`Abrir seu pedido, ${quantity}`} aria-haspopup="dialog">
    <span className="floating-order-bag-art" aria-hidden="true">
      <svg viewBox="0 0 96 104" fill="none" focusable="false">
        <path d="M32 35V22a16 16 0 0 1 32 0v13" stroke="#D56B2A" strokeWidth="5" strokeLinecap="round"/>
        <path d="M23 32h50a6 6 0 0 1 6 5l6 52a10 10 0 0 1-10 11H21A10 10 0 0 1 11 89l6-52a6 6 0 0 1 6-5Z" fill="#FFF3E1" stroke="#E9BD91" strokeWidth="1.5"/>
        <path d="m75 35 7 53a8 8 0 0 1-8 9H22l-6-5h54a7 7 0 0 0 7-8l-5-49h3Z" fill="#F4D9BA"/>
        <path d="M25 37h44" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <BrandLogo variant="icon" decorative eager/>
      {count > 0 && <span className="floating-order-bag-count">{count > 99 ? "99+" : count}</span>}
    </span>
    <span className="sr-only" role="status">{quantity} no pedido</span>
  </button>;
}
