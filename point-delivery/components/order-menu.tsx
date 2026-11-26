"use client";

import { useState } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { money, type Ingredient, type Selection } from "@/domain/menu";
import { BurgerQuantity } from "./burger-quantity";
import { AccompanimentMenu } from "./accompaniment-menu";
import "@/app/order-menu.css";

type Filter = "todos" | "hamburgueres" | "batatas" | "bebidas";
const filters: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "hamburgueres", label: "Hambúrguer" },
  { id: "batatas", label: "Batata frita" },
  { id: "bebidas", label: "Bebidas" },
];

type Props = {
  quantity: number;
  available: number;
  burgerPrice: number | undefined;
  items: Ingredient[];
  selection: Selection;
  disabled: boolean;
  itemCount: number;
  total: number;
  deliveryFee: number | null;
  canReview: boolean;
  onQuantity: (quantity: number) => void;
  onAssemble: () => void;
  onChange: (item: Ingredient, delta: number) => void;
  onReview: () => void;
};

export function OrderMenu(props: Props) {
  const [filter, setFilter] = useState<Filter>("todos");
  return <div className="order-menu">
    <div className="order-menu-filters" role="group" aria-label="Filtrar cardápio">
      {filters.map(option => <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.label}</button>)}
    </div>
    {props.itemCount > 0 && <div className="order-menu-summary" aria-label="Resumo do pedido">
      <div aria-live="polite"><small><ShoppingBag size={13} aria-hidden="true"/>{props.itemCount} {props.itemCount === 1 ? "item no pedido" : "itens no pedido"}</small><strong>{money(props.total)}</strong><span>{props.deliveryFee === null ? "Entrega a configurar" : `Inclui ${money(props.deliveryFee)} de entrega`}</span></div>
      <button type="button" className="button primary" onClick={props.onReview} disabled={props.disabled || !props.canReview}>Revisar pedido<ArrowRight size={17}/></button>
    </div>}
    {(filter === "todos" || filter === "hamburgueres") && <BurgerQuantity quantity={props.quantity} available={props.available} price={props.burgerPrice} disabled={props.disabled} onChange={props.onQuantity} onStart={props.onAssemble}/>}
    {filter !== "hamburgueres" && <section className="order-menu-sides" aria-labelledby="order-menu-sides-title">
      <div className="order-menu-category-heading"><div><h3 id="order-menu-sides-title" tabIndex={-1}>{filter === "batatas" ? "Porções de batata frita" : filter === "bebidas" ? "Escolha sua bebida" : "Batatas e bebidas"}</h3><p>Pode acompanhar seu lanche ou ser o pedido inteiro.</p></div><span>ESCOLHA E ADICIONE</span></div>
      <AccompanimentMenu items={props.items} selection={props.selection} disabled={props.disabled} onChange={props.onChange} filter={filter} showFilters={false}/>
    </section>}
  </div>;
}
