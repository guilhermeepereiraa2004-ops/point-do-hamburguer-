"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import imageAssets from "./menu-image-assets.json";
import beverageAssets from "./beverage-photos.json";
import { combineSelections, MAX_BURGERS, summarizeCart } from "@/domain/cart";
import { countItems, getStockShortages, isIngredientAvailable, money, summarize, type Catalog, type Ingredient, type Selection } from "@/domain/menu";
import type { BagBurgerGroup } from "@/domain/order-bag";
import "@/app/order-bag.css";

type Props = {
  open: boolean; catalog: Catalog; burgers: Selection[]; recipients: string[]; groups: BagBurgerGroup[]; drafts: number[]; extras: Selection;
  disabled: boolean; storeOpen: boolean; error: string;
  onClose: () => void; onBrowse: () => void; onCheckout: () => void;
  onQuantity: (source: number, quantity: number) => void; onRemoveBurger: (index: number) => void; onEdit: (index: number) => void;
  onRecipient: (index: number, name: string) => void; onExtra: (item: Ingredient, delta: number) => void;
};
const fries = new Set(["tradicional", "bacon", "calabresa", "cheddar", "bacon-calabresa", "bacon-cheddar", "calabresa-cheddar", "completa"].map(flavor => `batata-frita-${flavor}`));
const beverages: Record<string, string> = beverageAssets;
function extraPhoto(item: Ingredient) {
  if (fries.has(item.id)) return `/images/accompaniments/baskets-v2/${item.id}.webp`;
  return beverages[item.id];
}

export function OrderBag(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!props.open || !node) return;
    node.showModal();
    return () => node.close();
  }, [props.open]);
  const ready = props.groups.flatMap(group => group.indices.map(index => props.burgers[index]));
  const extras = props.catalog.ingredients.filter(item => item.category === "Complementos" && props.extras[item.id] > 0);
  const count = ready.length + Object.values(props.extras).reduce((sum, value) => sum + value, 0);
  const summary = summarizeCart(ready, props.extras, props.catalog);
  const shortages = getStockShortages(combineSelections([...ready, props.extras]), props.catalog);
  const total = count ? summary.subtotal + (props.catalog.deliveryFee ?? 0) : 0;
  const canContinue = props.storeOpen && !props.disabled && summary.valid && !props.drafts.length && !shortages.length && props.catalog.deliveryFee !== null;
  return <dialog ref={dialog} className="order-bag-dialog" aria-labelledby="order-bag-title" onCancel={event => { event.preventDefault(); props.onClose(); }} onClick={event => { if (event.target === event.currentTarget) props.onClose(); }}>
    <form className="order-bag-panel" onSubmit={event => { event.preventDefault(); props.onCheckout(); }}>
      <header className="order-bag-header"><BrandLogo variant="icon" decorative/><div><span>POINT DO HAMBÚRGUER</span><h2 id="order-bag-title">Sua sacola</h2><p aria-live="polite">{count} {count === 1 ? "item adicionado" : "itens adicionados"}</p></div><button type="button" className="order-bag-close" aria-label="Fechar sacola" onClick={props.onClose} autoFocus><X size={21}/></button></header>
      <div className="order-bag-body">
        {!count && !props.drafts.length && <div className="order-bag-empty"><span><ShoppingBag size={35} strokeWidth={1.4}/></span><h3>Sua sacola está vazia</h3><p>Monte seu hambúrguer ou escolha algo para acompanhar.</p><button type="button" className="button primary" onClick={props.onBrowse}>Escolher produtos<ArrowRight size={17}/></button></div>}
        {props.groups.map(group => {
          const source = group.indices[0], title = `Hambúrguer ${source + 1}`, quantity = group.indices.length;
          const price = summarize(group.recipe, props.catalog).burgerPrice;
          const canAdd = props.storeOpen && props.burgers.length < MAX_BURGERS && price !== undefined && !getStockShortages(combineSelections([...props.burgers, group.recipe, props.extras]), props.catalog).length;
          return <article className="order-bag-product" key={group.key} aria-label={title}>
            <div className="order-bag-product-heading"><img src={imageAssets.hero.src} srcSet={imageAssets.hero.srcSet} sizes="70px" width={70} height={70} alt="" loading="lazy" decoding="async"/><div><span>DO SEU JEITO</span><h3>{title}</h3><small>{price === undefined ? "Revise o preço" : `${money(price)} cada`}</small></div><strong>{price === undefined ? "A revisar" : money(price * quantity)}</strong></div>
            <p className="order-bag-recipe">{props.catalog.ingredients.filter(item => group.recipe[item.id] > 0 && item.category !== "Pães").map(item => `${group.recipe[item.id]}× ${item.name}`).join(" · ")}</p>
            <div className="order-bag-product-actions"><button type="button" className="order-bag-edit" disabled={props.disabled} onClick={() => props.onEdit(source)}>Editar ingredientes</button><div className="order-bag-counter"><button type="button" aria-label={`Diminuir quantidade do ${title.toLowerCase()}`} disabled={props.disabled} onClick={() => props.onQuantity(source, quantity - 1)}><Minus size={16}/></button><output aria-live="polite">{quantity}</output><button type="button" aria-label={`Aumentar quantidade do ${title.toLowerCase()}`} disabled={props.disabled || !canAdd} onClick={() => props.onQuantity(source, quantity + 1)}><Plus size={16}/></button></div><button type="button" className="order-bag-remove" aria-label={`Remover ${title.toLowerCase()} da sacola`} disabled={props.disabled} onClick={() => props.onQuantity(source, 0)}><Trash2 size={16}/></button></div>
            {props.burgers.length > 1 && <fieldset className="order-bag-recipients"><legend>Para quem são os lanches?</legend>{group.indices.map(index => <label key={index}>Lanche {index + 1}<input value={props.recipients[index] || ""} onChange={event => props.onRecipient(index, event.target.value)} aria-label={`Nome de quem recebe o lanche ${index + 1}`} placeholder="Nome da pessoa" required pattern={".*\\S.*"} maxLength={60} disabled={props.disabled}/></label>)}</fieldset>}
          </article>;
        })}
        {extras.map(item => {
          const quantity = props.extras[item.id], photo = extraPhoto(item);
          return <article className="order-bag-product" key={item.id} aria-label={item.name}><div className="order-bag-product-heading">{photo ? <img src={photo} width={70} height={70} alt="" loading="lazy" decoding="async"/> : <span className="order-bag-photo-placeholder"><ShoppingBag size={26}/></span>}<div><h3>{item.name}</h3><small>{item.price === null ? "Preço a configurar" : `${money(item.price)} cada`}</small></div><strong>{item.price === null ? "A revisar" : money(item.price * quantity)}</strong></div><div className="order-bag-product-actions"><span>Acompanhamento</span><div className="order-bag-counter"><button type="button" aria-label={`Diminuir ${item.name} na sacola`} disabled={props.disabled} onClick={() => props.onExtra(item, -1)}><Minus size={16}/></button><output aria-live="polite">{quantity}</output><button type="button" aria-label={`Aumentar ${item.name} na sacola`} disabled={props.disabled || !props.storeOpen || !isIngredientAvailable(item) || item.price === null || quantity >= Math.min(item.stock, item.maxQty)} onClick={() => props.onExtra(item, 1)}><Plus size={16}/></button></div><button type="button" className="order-bag-remove" aria-label={`Remover ${item.name} da sacola`} disabled={props.disabled} onClick={() => props.onExtra(item, -quantity)}><Trash2 size={16}/></button></div></article>;
        })}
        {props.drafts.map(index => <article className="order-bag-draft" key={index}><span>EM MONTAGEM</span><h3>Hambúrguer {index + 1}</h3><p>{countItems(props.burgers[index], props.catalog)} {countItems(props.burgers[index], props.catalog) === 1 ? "item escolhido" : "itens escolhidos"}. Finalize a montagem para incluir este lanche.</p><div><button type="button" disabled={props.disabled} onClick={() => props.onEdit(index)}>Continuar montagem<ArrowRight size={15}/></button><button type="button" className="order-bag-remove" disabled={props.disabled} aria-label={`Remover montagem do hambúrguer ${index + 1}`} onClick={() => props.onRemoveBurger(index)}><Trash2 size={16}/></button></div></article>)}
        {props.drafts.length > 0 && <p className="order-bag-notice" role="status">Finalize ou remova os lanches em montagem para continuar.</p>}
        {!props.storeOpen && <p className="order-bag-notice" role="status">A hamburgueria está fechada no momento.</p>}
        {shortages.length > 0 && <p className="order-bag-notice" role="status">Ajuste os produtos indisponíveis: {shortages.map(item => item.name).join(", ")}.</p>}
        {count > 0 && props.catalog.deliveryFee === null && <p className="order-bag-notice" role="status">A taxa de entrega ainda não foi configurada.</p>}
        {props.error && <p className="order-bag-notice" role="alert">{props.error}</p>}
      </div>
      <footer className="order-bag-footer"><div className="order-bag-totals" aria-live="polite"><div><span>Produtos</span><strong>{money(summary.subtotal)}</strong></div><div><span>Entrega</span><strong>{props.catalog.deliveryFee === null ? "A configurar" : money(count ? props.catalog.deliveryFee : 0)}</strong></div><div><span>Total do pedido</span><strong>{money(total)}</strong></div></div><button type="submit" className="button primary" disabled={!canContinue}>Continuar para entrega<ArrowRight size={18}/></button><button type="button" className="order-bag-continue" onClick={props.onClose}><ArrowLeft size={15}/>Continuar escolhendo</button></footer>
    </form>
  </dialog>;
}
