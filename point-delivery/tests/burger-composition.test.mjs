import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { composeBurger, ingredientIds, assemblyOrder } from "../components/burger-composition.ts";
const photos = JSON.parse(readFileSync(new URL("../components/ingredient-photos.json", import.meta.url), "utf8"));
const baseline = { pao: 1, "carne-hamburguer": 1, queijo: 1, salada: 1 };
const everyIngredient = quantity => ({ pao: 1, ...Object.fromEntries(ingredientIds.map(id => [id, quantity])) });
const extent = composition => {
  const lid = composition.layers.find(layer => layer.role === "lid");
  const base = composition.layers.find(layer => layer.role === "bread");
  return base.y + base.height - lid.y;
};

test("one to four patties use coherent photographs instead of repeated identical discs", () => {
  const heights = [];
  for (let quantity = 1; quantity <= 4; quantity++) {
    const burger = composeBurger({ ...baseline, "carne-hamburguer": quantity }, photos);
    const beef = burger.layers.filter(layer => layer.id === "carne-hamburguer");
    assert.equal(beef.length, 1);
    assert.equal(beef[0].photoId, `carne-${quantity}`);
    assert.equal(beef[0].quantity, quantity);
    assert.equal(burger.count, quantity + 2);
    heights.push(beef[0].height);
  }
  assert.ok(heights[3] > heights[0]);
  assert.ok(heights[3] < heights[0] * 1.6, "four thin patties should not create a tower");
});

test("whole alpha silhouettes retain their full proportions and irregular food edges", () => {
  for (const selection of [baseline, everyIngredient(1), everyIngredient(4)]) {
    for (const layer of composeBurger(selection, photos).layers) {
      const original = photos[layer.photoId];
      assert.deepEqual(layer.crop, original.crop, `${layer.photoId} must not be sliced into a front strip`);
      assert.ok(Math.abs(layer.height / layer.width - original.crop.height / original.crop.width) < 1e-8);
      assert.ok(Number.isFinite(layer.x + layer.y + layer.width + layer.height));
      assert.ok(layer.width > 0 && layer.height > 0);
    }
  }
});

test("all 15 ingredients share a compact filling pocket with exact selected quantities", () => {
  const ordinary = composeBurger(baseline, photos);
  for (const quantity of [1, 4]) {
    const complete = composeBurger(everyIngredient(quantity), photos);
    assert.equal(complete.count, 15 * quantity);
    assert.equal(complete.viewBox, ordinary.viewBox);
    const width = Math.max(...complete.layers.map(l => l.x + l.width)) - Math.min(...complete.layers.map(l => l.x));
    assert.ok(extent(complete) < width, "sandwich should remain wider than it is tall");
    for (const id of ingredientIds) {
      const representation = complete.layers.filter(layer => layer.id === id);
      assert.ok(representation.length, `${id} should be represented`);
      assert.ok(representation.every(layer => layer.quantity === quantity));
    }
  }
});

test("opening lifts the lid clear of the fillings while the camera stays fixed", () => {
  for (const selection of [{ pao: 1 }, baseline, everyIngredient(1), everyIngredient(4)]) {
    const burger = composeBurger(selection, photos);
    const lid = burger.layers.find(layer => layer.role === "lid");
    const bodyTop = Math.min(...burger.layers.filter(layer => layer.role !== "lid").map(layer => layer.y));
    assert.ok(lid.y + lid.height - burger.openLift <= bodyTop - 25);
    assert.ok(lid.y - burger.openLift + burger.openShift >= 0, "open bun must remain in frame");
    assert.ok(burger.baseBottom + burger.openShift <= 450, "bottom bun must remain in frame");
    assert.ok(lid.y + burger.closedShift >= 0);
    assert.ok(burger.baseBottom + burger.closedShift <= 450);
    assert.equal(burger.viewBox, "0 0 400 450");
  }
});

test("extra cheese and small toppings add density without new full-height floors", () => {
  const single = composeBurger(baseline, photos);
  const repeated = composeBurger({ ...baseline, queijo: 4, "milho-verde": 3, ervilha: 2 }, photos);
  assert.equal(repeated.count, 11);
  assert.ok(Math.abs(extent(repeated) - extent(single)) < 15);
  assert.equal(repeated.layers.filter(layer => layer.id === "queijo").length, 1);
  for (const id of ["milho-verde", "ervilha"]) {
    const pieces = repeated.layers.filter(layer => layer.id === id);
    assert.ok(pieces.every(piece => piece.width <= 136 && piece.height < 45), "grain portions remain shallow relative to the bun");
  }
});

test("cohesive garnishes sit below the salad with corn and peas in front of the straw", () => {
  const burger = composeBurger({ ...baseline, "milho-verde": 1, ervilha: 1, "batata-palha": 1 }, photos);
  const saladIndex = burger.layers.findIndex(layer => layer.id === "salada");
  for (const id of ["milho-verde", "ervilha", "batata-palha"]) {
    const pieces = burger.layers.filter(layer => layer.id === id);
    assert.equal(pieces.length, 1, "one portion should be a cohesive group, not distant specks");
    assert.ok(burger.layers.every((layer, index) => layer.id !== id || index < saladIndex));
    assert.ok(pieces.every(p => p.y >= burger.proteinTop - 20 && p.y + p.height <= burger.proteinTop + 45));
    assert.ok(pieces.every(p => p.height >= 35 && p.height <= 55), "portions must be visible without forming a tall mound");
  }
  assert.ok(burger.layers.findIndex(l => l.id === "batata-palha") < burger.layers.findIndex(l => l.id === "milho-verde"));
  const corn = burger.layers.find(l => l.id === "milho-verde");
  const peas = burger.layers.find(l => l.id === "ervilha");
  assert.ok(peas.x - (corn.x + corn.width) < 5, "grain portions must touch rather than float apart");
});

test("four portions add density without enlarging grains or creating a new floor", () => {
  const one = composeBurger({ ...baseline, "milho-verde": 1, ervilha: 1, "batata-palha": 1 }, photos);
  const four = composeBurger({ ...baseline, "milho-verde": 4, ervilha: 4, "batata-palha": 4 }, photos);
  assert.equal(one.count, 6);
  assert.equal(four.count, 15);
  assert.ok(Math.abs(extent(four) - extent(one)) < 10);
  for (const id of ["milho-verde", "ervilha", "batata-palha"]) {
    const before = one.layers.filter(layer => layer.id === id);
    const after = four.layers.filter(layer => layer.id === id);
    assert.ok(after.length > before.length);
    assert.ok(Math.max(...after.map(p => p.width)) <= Math.max(...before.map(p => p.width)));
  }
});

test("complements alone rest on the cut bread surface and stay visible at every quantity", () => {
  for (const quantity of [1, 4]) {
    const burger = composeBurger({ pao: 1, "milho-verde": quantity, ervilha: quantity, "batata-palha": quantity }, photos);
    const base = burger.layers.find(l => l.role === "bread");
    const surface = base.y + 25;
    for (const id of ["milho-verde", "ervilha", "batata-palha"]) {
      const portions = burger.layers.filter(l => l.id === id);
      assert.equal(portions.length, quantity);
      assert.ok(portions.every(l => l.y < surface - 30 && l.y + l.height >= surface - 10 && l.y + l.height <= surface + 4), `${id} should touch the bread rather than hover or disappear inside it`);
    }
    assert.deepEqual([...new Set(burger.layers.map(l => l.id))], ["pao-base", "batata-palha", "milho-verde", "ervilha", "pao-topo"]);
  }
});

test("all 24 click orders of corn, ham, peas and beef produce exactly the same burger", () => {
  const ids = ["milho-verde", "presunto", "ervilha", "carne-hamburguer"];
  function permutations(values) {
    return values.length ? values.flatMap((id, index) => permutations(values.filter((_, i) => i !== index)).map(rest => [id, ...rest])) : [[]];
  }
  const expected = composeBurger({ pao: 1, ...Object.fromEntries(ids.map(id => [id, 1])) }, photos);
  for (const order of permutations(ids)) {
    const selection = { pao: 1 };
    for (const id of order) selection[id] = 1;
    assert.deepEqual(composeBurger(selection, photos), expected, order.join(" → "));
  }
  assert.deepEqual([...new Set(expected.layers.map(l => l.id))], ["pao-base", "carne-hamburguer", "presunto", "milho-verde", "ervilha", "pao-topo"]);
});

test("the full menu follows the house assembly order after additions, removals and reinsertion", () => {
  const expectedOrder = ["pao-base", "carne-hamburguer", "frango", "calabresa", "salsicha", "queijo", "cheddar", "presunto", "ovo", "bacon", "catupiry", "cebola", "batata-palha", "milho-verde", "ervilha", "salada", "pao-topo"];
  assert.deepEqual(assemblyOrder, expectedOrder);
  for (let start = 0; start < ingredientIds.length; start++) {
    const order = [...ingredientIds.slice(start), ...ingredientIds.slice(0, start)].reverse();
    const selection = { pao: 1, ...Object.fromEntries(order.map(id => [id, 1 + ingredientIds.indexOf(id) % 4])) };
    const original = composeBurger(selection, photos);
    assert.deepEqual([...new Set(original.layers.map(l => l.id))], expectedOrder);
    for (const id of order) { const quantity = selection[id]; delete selection[id]; selection[id] = quantity; }
    assert.deepEqual(composeBurger(selection, photos), original);
  }
});

test("changing ingredients removes unselected photos and leaves the input unchanged", () => {
  const selection = Object.freeze({ pao: 1, frango: 1, cebola: 1, queijo: 1 });
  const burger = composeBurger(selection, photos);
  assert.equal(burger.count, 3);
  assert.ok(!burger.layers.some(layer => layer.id === "carne-hamburguer"));
  for (const id of ["frango", "cebola", "queijo"]) assert.ok(burger.layers.some(layer => layer.id === id));
  assert.deepEqual(selection, { pao: 1, frango: 1, cebola: 1, queijo: 1 });
});

test("closing leaves a shallow window for tomato and filling edges instead of burying them under the bun", () => {
  for (const selection of [baseline, everyIngredient(1), everyIngredient(4)]) {
    const burger = composeBurger(selection, photos);
    const lid = burger.layers.find(layer => layer.role === "lid");
    const salad = burger.layers.find(layer => layer.id === "salada");
    const lidBottom = lid.y + lid.height + lid.closedOffset.y;
    const saladBottom = salad.y + salad.height + salad.closedOffset.y;
    assert.ok(saladBottom - lidBottom >= 40, "leave room for the red tomato rim and lettuce");
    assert.ok(saladBottom - lidBottom < 65, "the lid must still sit close to the fillings");
    const closedTop = Math.min(...burger.layers.map(layer => layer.y + layer.closedOffset.y));
    const closedWidth = Math.max(...burger.layers.map(l => l.x + l.width + l.closedOffset.x)) - Math.min(...burger.layers.map(l => l.x + l.closedOffset.x));
    assert.ok(burger.baseBottom - closedTop < closedWidth, "revealing fillings must not produce a tower");
    assert.ok(closedTop + burger.closedShift >= 0);
    assert.ok(burger.baseBottom + burger.closedShift <= 450);
  }
});

test("selected fillings peek beyond the lettuce at different sides without stretching the photos", () => {
  const burger = composeBurger(everyIngredient(1), photos);
  const salad = burger.layers.find(layer => layer.id === "salada");
  const saladFront = salad.y + salad.height + salad.closedOffset.y;
  for (const id of ["frango", "presunto", "bacon", "ovo", "calabresa", "salsicha", "catupiry", "cebola"]) {
    const layer = burger.layers.find(layer => layer.id === id);
    const exposedEdge = layer.y + layer.height + layer.closedOffset.y - saladFront;
    assert.ok(exposedEdge >= 4 && exposedEdge < 55, `${id} should reveal only a small front edge`);
    assert.ok(layer.x + layer.closedOffset.x >= 20);
    assert.ok(layer.x + layer.closedOffset.x + layer.width <= 380);
    assert.deepEqual(layer.crop, photos[layer.photoId].crop);
  }
  const left = burger.layers.find(layer => layer.id === "presunto");
  const right = burger.layers.find(layer => layer.id === "bacon");
  assert.ok(left.closedOffset.x < 0 && right.closedOffset.x > 0);
});
