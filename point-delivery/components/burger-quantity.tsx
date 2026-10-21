import { ArrowRight, Hamburger, Minus, Plus } from "lucide-react";
import { MAX_BURGERS } from "@/domain/cart";

type Props = {
  quantity: number;
  available: number;
  onChange: (quantity: number) => void;
  onStart: () => void;
};

export function BurgerQuantity({ quantity, available, onChange, onStart }: Props) {
  return (
    <div className="quantity-stage">
      <span className="quantity-emblem" aria-hidden="true"><Hamburger size={36} /></span>
      <p>Cada hambúrguer tem sua própria montagem.<br />O pão já está incluído em todos eles.</p>
      <div className="quantity-presets" role="group" aria-label="Quantidade de hambúrgueres">
        {[1, 2, 3, 4].map(value => (
          <button key={value} type="button" aria-pressed={quantity === value} disabled={value > available} onClick={() => onChange(value)}>
            <Hamburger size={23} aria-hidden="true" />
            <strong>{value}</strong>
            <span>{value === 1 ? "hambúrguer" : "hambúrgueres"}</span>
          </button>
        ))}
      </div>
      <div className="quantity-custom">
        <span>Quantos vão ser?<small>De 1 a {MAX_BURGERS} por pedido</small></span>
        <div className="quantity-counter">
          <button type="button" aria-label="Diminuir quantidade de hambúrgueres" disabled={quantity <= 1} onClick={() => onChange(quantity - 1)}><Minus size={18} /></button>
          <output aria-live="polite" aria-label="Quantidade escolhida">{quantity}</output>
          <button type="button" aria-label="Aumentar quantidade de hambúrgueres" disabled={quantity >= available} onClick={() => onChange(quantity + 1)}><Plus size={18} /></button>
        </div>
      </div>
      {available < MAX_BURGERS && <p className="quantity-stock" role="status">{available > 0 ? `Disponibilidade para até ${available} hambúrgueres neste momento.` : "Os hambúrgueres estão indisponíveis no momento."}</p>}
      <button type="button" className="button primary quantity-start" disabled={quantity > available} onClick={onStart}>Montar {quantity} {quantity === 1 ? "hambúrguer" : "hambúrgueres"}<ArrowRight size={18} /></button>
      <small className="quantity-footnote">Pode voltar aqui para alterar a quantidade. Ao reduzir, as últimas montagens serão removidas.</small>
    </div>
  );
}
