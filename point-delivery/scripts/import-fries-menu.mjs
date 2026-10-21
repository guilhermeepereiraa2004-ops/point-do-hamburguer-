// Explicit, one-time import of the real menu supplied by the owner on 2026-10-20.
// Local preview only. Re-runs skip existing products, preserving subsequent edits.
import { readFileSync } from "node:fs";
const base = "http://127.0.0.1:4178";
const headers = { cookie: "__sites_local_auth=1", origin: base, "content-type": "application/json" };
const menu = JSON.parse(readFileSync(new URL("../data/fries-menu.json", import.meta.url), "utf8"));
const response = await fetch(`${base}/api/admin`, { headers });
if (!response.ok) throw new Error(`Admin indisponível (${response.status}).`);
const dashboard = await response.json();
const existing = new Set(dashboard.catalog.ingredients.map(item => item.id));
async function save(input) {
  const response = await fetch(`${base}/api/admin`, { method: "POST", headers, body: JSON.stringify(input) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Falha (${response.status}).`);
}
for (const item of menu) {
  if (existing.has(item.id)) { console.log(`Já cadastrado: ${item.productName}`); continue; }
  await save({ kind: "accompaniment", create: true, ...item, extraType: "batata-frita", flavor: "", size: "Porção", stock: 0, lowStock: 5, maxQty: 4 });
  await save({ kind: "featured", id: item.id, value: true });
  console.log(`Cadastrado: ${item.productName} — R$ ${(item.price / 100).toFixed(2)} — estoque 0`);
}
