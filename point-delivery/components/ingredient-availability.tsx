import type { Ingredient } from "../domain/menu";
import { isIngredientAvailable } from "../domain/menu";
import "../app/menu-availability.css";

export function IngredientAvailability({ item }: { item: Ingredient }) {
  const available = isIngredientAvailable(item);
  const unit = item.stock === 1 ? item.unit : item.unit === "porção" ? "porções" : `${item.unit}s`;
  return <span id={`availability-${item.id}`} className={`ingredient-status ${available ? "is-available" : "is-unavailable"}`} role="status">
    {available ? item.stock < item.maxQty ? `Disponível: ${item.stock} ${unit}` : `1 ${item.unit}` : "Indisponível"}
  </span>;
}
