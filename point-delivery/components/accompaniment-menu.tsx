"use client";
import { useState } from "react";
import { ChevronDown, CupSoda, Minus, Pause, Play, Plus, Utensils } from "lucide-react";
import { isIngredientAvailable, money, type Ingredient, type Selection } from "@/domain/menu";

const groups = [
  { id: "batatas", title: "Batata frita", description: "Porções para dividir. Ou não.", icon: Utensils },
  { id: "bebidas", title: "Bebidas", description: "Refrigerantes e sucos", icon: CupSoda },
  { id: "outros", title: "Outros acompanhamentos", description: "Mais opções do seu point", icon: Utensils },
];
const friesPhotos = new Set(["tradicional", "bacon", "calabresa", "cheddar", "bacon-calabresa", "bacon-cheddar", "calabresa-cheddar", "completa"].map(flavor => `batata-frita-${flavor}`));
export function accompanimentGroup(item: Ingredient) {
  const type = item.extraType || item.id;
  return type === "batata-frita" ? "batatas" : ["refrigerante", "suco"].includes(type) ? "bebidas" : "outros";
}
export function AccompanimentMenu({ items, selection, disabled, onChange }: { items: Ingredient[]; selection: Selection; disabled: boolean; onChange: (item: Ingredient, delta: number) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [motion, setMotion] = useState(true);
  return <div className="accompaniment-menu" data-motion={motion ? "on" : "off"}><button type="button" className="accompaniment-motion" aria-pressed={!motion} onClick={() => setMotion(value => !value)}>{motion ? <Pause size={12}/> : <Play size={12}/>} {motion ? "Pausar movimento" : "Ativar movimento"}</button>{groups.map(group => {
    const products = items.filter(item => accompanimentGroup(item) === group.id);
    if (!products.length && group.id === "outros") return null;
    const quantity = products.reduce((sum, item) => sum + (selection[item.id] || 0), 0);
    const Icon = group.icon;
    return <section className={`menu-category ${open === group.id ? "is-open" : ""}`} key={group.id}>
      <h4><button type="button" className="menu-category-toggle" aria-expanded={open === group.id} aria-controls={`category-${group.id}`} onClick={() => setOpen(open === group.id ? null : group.id)}>
        <span className={`menu-category-icon ${group.id}`}><Icon size={23}/></span><span><strong>{group.title}</strong><small>{group.description}</small></span>
        {quantity > 0 && <b className="category-quantity">{quantity}</b>}<ChevronDown size={18}/>
      </button></h4>
      <div id={`category-${group.id}`} hidden={open !== group.id} className="menu-category-products">
        {!products.length && <p className="accompaniment-empty">Novas opções em breve.</p>}
        {products.map((item, index) => {
          const value = selection[item.id] || 0, available = isIngredientAvailable(item) && item.price !== null;
          const photo = friesPhotos.has(item.id) ? `/images/accompaniments/baskets-v2/${item.id}.webp` : item.id === "refrigerante" ? "/images/accompaniments/baskets-v2/refrigerante.webp" : null;
          return <div className={`compact-product ${photo ? "has-photo" : ""} ${value ? "is-selected" : ""} ${!available ? "sold-out" : ""}`} key={item.id}>
            {photo && <div className={`accompaniment-photo ${item.id === "refrigerante" ? "is-drink" : ""}`}><img src={photo} alt="" width={144} height={144} loading="lazy" decoding="async" style={{animationDelay: `${index * -.65}s`}}/></div>}
            <div className="compact-product-info"><h5>{item.name}</h5>{item.description && <p>{item.description}</p>}
              <div className="compact-product-price"><strong>{item.price === null ? "Preço a configurar" : money(item.price)}</strong>{!available && <span>Indisponível</span>}</div>
              {!item.featured && value > 0 && <small>Retirado do cardápio. Remova para continuar.</small>}
            </div>
            <div className={`counter ${value ? "has-value" : ""}`}><button type="button" aria-label={`Remover ${item.name}`} disabled={disabled || !value} onClick={() => onChange(item, -1)}><Minus size={14}/></button><span aria-live="polite">{value}</span><button type="button" aria-label={`Adicionar ${item.name}`} disabled={disabled || !available || value >= Math.min(item.maxQty, item.stock)} onClick={() => onChange(item, 1)}><Plus size={14}/></button></div>
          </div>;
        })}
      </div>
    </section>;
  })}</div>;
}
