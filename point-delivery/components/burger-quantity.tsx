import { ArrowRight, Minus, Plus } from "lucide-react";
import { MAX_BURGERS } from "@/domain/cart";
import { money } from "@/domain/menu";
import imageAssets from "./menu-image-assets.json";

type Props = {
  quantity: number;
  available: number;
  onChange: (quantity: number) => void;
  onStart: () => void;
  price: number | undefined;
  disabled: boolean;
};

export function BurgerQuantity({ quantity, available, price, disabled, onChange, onStart }: Props) {
  return (
    <article className={`order-burger-card${available === 0 ? " is-unavailable" : ""}`} aria-labelledby="menu-burger-title">
      <div className="order-burger-photo">
        <img src={imageAssets.hero.src} srcSet={imageAssets.hero.srcSet} sizes="(max-width: 760px) 130px, 360px" width={imageAssets.hero.width} height={imageAssets.hero.height} alt="Sugestão de hambúrguer com carne, queijo, bacon e salada" loading="lazy" decoding="async" />
        <span>Você monta</span>
      </div>
      <div className="order-burger-info">
        <small>O SEU CLÁSSICO, DO SEU JEITO</small>
        <h3 id="menu-burger-title" tabIndex={-1}>Monte seu hambúrguer</h3>
        <p>Escolha a quantidade aqui. Depois, os recheios de cada lanche.</p>
        <div className="order-burger-price"><span>A partir de</span><strong>{price === undefined ? "Preço a configurar" : money(price)}</strong><small>Pão incluso · mínimo de 3 itens</small></div>
      </div>
      <div className="order-burger-actions">
        <div className="order-burger-quantity">
          <span>Quantidade<small>Até {MAX_BURGERS} por pedido</small></span>
          <div className="quantity-counter">
            <button type="button" aria-label="Diminuir quantidade de hambúrgueres" disabled={disabled || quantity <= 1} onClick={() => onChange(quantity - 1)}><Minus size={18} /></button>
            <output aria-live="polite" aria-label="Quantidade de hambúrgueres escolhida">{quantity}</output>
            <button type="button" aria-label="Aumentar quantidade de hambúrgueres" disabled={disabled || quantity >= available} onClick={() => onChange(quantity + 1)}><Plus size={18} /></button>
          </div>
        </div>
        <button type="button" className="button primary" disabled={disabled || quantity > available || price === undefined} onClick={onStart}>Montar {quantity} {quantity === 1 ? "hambúrguer" : "hambúrgueres"}<ArrowRight size={18} /></button>
        {available < MAX_BURGERS && <p className="order-burger-stock" role="status">{available > 0 ? `Disponível para até ${available} ${available === 1 ? "hambúrguer" : "hambúrgueres"} agora.` : "Hambúrguer indisponível no momento."}</p>}
      </div>
    </article>
  );
}
