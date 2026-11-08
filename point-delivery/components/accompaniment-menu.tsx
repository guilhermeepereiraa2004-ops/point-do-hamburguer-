"use client";
import { useState } from "react";
import { Minus, Pause, Play, Plus } from "lucide-react";
import { isIngredientAvailable, money, type Ingredient, type Selection } from "@/domain/menu";

const groups = [
  { id: "todos", title: "Todos" },
  { id: "bebidas", title: "Bebidas" },
  { id: "batatas", title: "Batata frita" },
  { id: "outros", title: "Outros" },
];
const friesPhotos = new Set(["tradicional", "bacon", "calabresa", "cheddar", "bacon-calabresa", "bacon-cheddar", "calabresa-cheddar", "completa"].map(flavor => `batata-frita-${flavor}`));
export function accompanimentGroup(item: Ingredient) {
  const type = item.extraType || item.id;
  return type === "batata-frita" ? "batatas" : ["refrigerante", "suco"].includes(type) ? "bebidas" : "outros";
}
export function AccompanimentMenu({ items, selection, disabled, onChange }: { items: Ingredient[]; selection: Selection; disabled: boolean; onChange: (item: Ingredient, delta: number) => void }) {
  const [filter, setFilter] = useState("todos");
  const products = items.filter(item => filter === "todos" || accompanimentGroup(item) === filter);
  const [motionChoice, setMotionChoice] = useState<"on" | "off">("on");
  const motion = motionChoice === "on";
  return <div className="accompaniment-menu" data-motion={motionChoice}><button type="button" className="accompaniment-motion" aria-pressed={!motion} onClick={() => setMotionChoice(motion ? "off" : "on")}>{motion ? <Pause size={12}/> : <Play size={12}/>} {motion ? "Pausar movimento" : "Ativar movimento"}</button>
    <div className="accompaniment-filters" role="group" aria-label="Filtrar acompanhamentos">{groups.map(group => <button type="button" key={group.id} aria-pressed={filter === group.id} onClick={() => setFilter(group.id)}>{group.title}<span>{group.id === "todos" ? items.length : items.filter(item => accompanimentGroup(item) === group.id).length}</span></button>)}</div>
    <div className="accompaniment-products" key={filter}>
      {!products.length && <p className="accompaniment-empty" role="status">Nenhum acompanhamento nesta categoria no momento.</p>}
        {products.map((item, index) => {
          const value = selection[item.id] || 0, available = isIngredientAvailable(item) && item.price !== null;
          const photo = friesPhotos.has(item.id) ? `/images/accompaniments/baskets-v2/${item.id}.webp` : item.id === "refrigerante" ? "/images/accompaniments/coca-cola-reference-v1.webp" : item.id === "refrigerante-1-litro" ? "/images/accompaniments/coca-cola-1l-real-v1.webp" : null;
          return <div className={`compact-product ${photo ? "has-photo" : ""} ${value ? "is-selected" : ""} ${!available ? "sold-out" : ""}`} key={item.id} style={{animationDelay: `${Math.min(index, 7) * 45}ms`}}>
            {photo && <div className={`accompaniment-photo ${["refrigerante","refrigerante-1-litro"].includes(item.id) ? "is-drink" : ""}`}><img src={photo} alt="" width={144} height={144} loading="lazy" decoding="async" style={{animationDelay: `${index * -.65}s`}}/></div>}
            <div className="compact-product-info"><h5>{item.name}</h5>{item.description && <p>{item.description}</p>}
              <div className="compact-product-price"><strong>{item.price === null ? "Preço a configurar" : money(item.price)}</strong>{!available && <span>Indisponível</span>}</div>
              {!item.featured && value > 0 && <small>Retirado do cardápio. Remova para continuar.</small>}
            </div>
            <div className={`counter ${value ? "has-value" : ""}`}><button type="button" aria-label={`Remover ${item.name}`} disabled={disabled || !value} onClick={() => onChange(item, -1)}><Minus size={14}/></button><span aria-live="polite"><b className={value ? "accompaniment-quantity-pop" : ""} key={value}>{value}</b></span><button type="button" aria-label={`Adicionar ${item.name}`} disabled={disabled || !available || value >= Math.min(item.maxQty, item.stock)} onClick={() => onChange(item, 1)}><Plus size={14}/></button></div>
          </div>;
        })}
    </div>
  </div>;
}
