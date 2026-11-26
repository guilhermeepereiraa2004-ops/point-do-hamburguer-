import { BrandLogo } from "./brand-logo";
import "@/app/floating-order-bag.css";

export function FloatingOrderBag({ count, disabled, onOpen }: { count: number; disabled: boolean; onOpen: () => void }) {
  const quantity = `${count} ${count === 1 ? "item" : "itens"}`;
  return <button type="button" className="floating-order-bag" onClick={onOpen} disabled={disabled} aria-label={`Abrir sacola, ${quantity}`}>
    <span className="floating-order-bag-art" aria-hidden="true">
      <svg viewBox="0 0 96 104" fill="none" focusable="false">
        <path d="M32 35V22a16 16 0 0 1 32 0v13" stroke="#D56B2A" strokeWidth="5" strokeLinecap="round"/>
        <path d="M17 32h62l8 65a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4l8-65Z" fill="#FFF8EC" stroke="#EBC9A7" strokeWidth="1.5"/>
        <path d="m79 32 8 65-11-6-4-59h7Z" fill="#FFD6B0"/>
        <path d="m10 94 7-5 59 2 11 6-4 4H13l-3-7Z" fill="#F4DABB"/>
        <path d="M20 36h49" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <BrandLogo variant="icon" decorative eager/>
      <span className="floating-order-bag-count" key={count}>{count > 99 ? "99+" : count}</span>
    </span>
    <span className="floating-order-bag-label">Sua sacola</span>
    <span className="sr-only" role="status">{quantity} na sacola</span>
  </button>;
}
