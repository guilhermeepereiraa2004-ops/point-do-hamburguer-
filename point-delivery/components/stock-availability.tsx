import type { StockShortage } from "../domain/menu";
import "../app/stock-availability.css";

export function StockAvailability({ items, onAdjust }: { items: StockShortage[]; onAdjust: () => void }) {
  if (!items.length) return null;
  return <div className="stock-availability" role="status" aria-live="polite">
    <h3>Vamos ajustar seu pedido</h3>
    <p>Estes ingredientes não têm a quantidade que você escolheu:</p>
    <ul>{items.map(item => <li key={item.id}>
      <strong>{item.name}</strong>
      <span>{item.available === 0 ? "Indisponível no momento." : `Disponível: ${item.available} ${item.available === 1 ? item.unit : item.unit === "porção" ? "porções" : `${item.unit}s`}.`} No pedido: {item.requested}.</span>
    </li>)}</ul>
    <button type="button" onClick={onAdjust}>Revisar ingredientes <span aria-hidden="true">→</span></button>
    <small>Seus dados de entrega ficam salvos enquanto você ajusta.</small>
  </div>;
}
