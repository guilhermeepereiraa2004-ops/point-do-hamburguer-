import { money, type Order } from "@/domain/menu";

function ItemList({ items }: { items: Order["items"] }) {
  return <ul>{items.map((item, index) => <li key={index}><b>{item.quantity}×</b>{item.name}</li>)}</ul>;
}

export function OrderContents({ order }: { order: Pick<Order, "burgers" | "extras" | "items"> }) {
  if (!order.burgers?.length) return <ItemList items={order.items}/>;
  return <div className="admin-burger-recipes">
    {order.burgers.map((burger, index) => <section key={index}>
      <header><strong>Hambúrguer {index + 1}{burger.recipient ? ` · ${burger.recipient}` : ""}</strong><span>{money(burger.price)}</span></header>
      <ItemList items={burger.items}/>
    </section>)}
    {order.extras?.length ? <section><header><strong>Acompanhamentos</strong></header><ItemList items={order.extras}/></section> : null}
  </div>;
}
