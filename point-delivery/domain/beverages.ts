import type { Ingredient } from "./menu";

export const beverageGroups = [
  { id: "litro", title: "Refrigerante 1 litro" },
  { id: "600ml", title: "Coca-Cola 600 ml" },
  { id: "energeticos", title: "Energéticos" },
  { id: "lata", title: "Refrigerante lata" },
  { id: "aguas", title: "Água" },
  { id: "mini-pet", title: "Refrigerante mini PET" },
  { id: "sucos-prontos", title: "Sucos Del Valle e Skinka" },
  { id: "sucos-fruta", title: "Sucos da fruta" },
  { id: "outras-bebidas", title: "Outras bebidas" },
] as const;
export type BeverageGroup = typeof beverageGroups[number]["id"];

export function beverageGroup(item: Ingredient): BeverageGroup | null {
  const type = item.extraType || item.id;
  if (type === "agua") return "aguas";
  if (type === "energetico") return "energeticos";
  if (type === "suco") {
    const brand = (item.productName || item.name).toLocaleLowerCase("pt-BR");
    return /del\s*valle|skinka/.test(brand) ? "sucos-prontos" : "sucos-fruta";
  }
  if (type !== "refrigerante") return null;
  const size = (item.size || "").toLocaleLowerCase("pt-BR").replace(/\s/g, "");
  if (["1l", "1litro", "1000ml"].includes(size)) return "litro";
  if (size === "600ml") return "600ml";
  if (size.includes("lata")) return "lata";
  if (size.includes("mini")) return "mini-pet";
  return "outras-bebidas";
}
