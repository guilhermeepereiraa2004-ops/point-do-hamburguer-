import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCart, summarizeCart, validateBurgerRecipients } from '../domain/cart.ts';
import { burgerPriceForCount, ingredientNames, InsufficientStockError } from '../domain/menu.ts';
import { reserveOrder } from '../db/order-reservation.ts';
import { postgresFixture } from './postgres-fixture.mjs';
import { resizeBurgerDrafts, nextUnfinishedBurger, burgerIsFinished, repeatBurgerRecipe } from '../domain/assembly-flow.ts';

const item = (id, category, extra = {}) => ({ id, name: id, category, unit: 'unidade', stock: 30, maxQty: 4, active: true, price: null, ...extra });
const catalog = { ingredients: [item('pao','Pães',{maxQty:1}),item('carne','Proteínas'),item('queijo','Queijos'),item('bacon','Extras'),item('refri','Complementos',{featured:true,extraType:'refrigerante',price:700})], prices:{3:1300,4:1400,6:1600},deliveryFee:500 };
const first = {pao:1,carne:1,queijo:1,bacon:1}, second = {pao:1,carne:2,queijo:2}, heavy = {pao:1,carne:4,queijo:2};
test('burger prices start at fourteen for three items and keep increasing beyond thirty reais',()=>{
 const prices=Object.fromEntries(Array.from({length:17},(_,index)=>[index+3,(index+14)*100]));
 for(const [count,expected] of [[3,1400],[4,1500],[19,3000],[20,3100],[21,3200],[60,7100]]) assert.equal(burgerPriceForCount(count,prices),expected);
 for(const count of [0,1,2,3.5,NaN,Infinity]) assert.equal(burgerPriceForCount(count,prices),undefined);
 assert.equal(burgerPriceForCount(20,{}),undefined);
 assert.equal(burgerPriceForCount(5,{3:1800,4:2200}),2300);
 assert.equal(burgerPriceForCount(4,{3:1800,5:2500}),undefined);
 const largeCatalog={...catalog,prices,ingredients:[item('pao','Pães',{maxQty:1}),...ingredientNames.map(([id,name,category])=>item(id,category,{name})),item('refri','Complementos',{featured:true,price:500})]};
 const recipe={pao:1,...Object.fromEntries(ingredientNames.map(([id])=>[id,4]))};
 const result=validateCart([recipe,recipe],{refri:1},largeCatalog);
 assert.deepEqual(result.snapshots.map(burger=>burger.price),[7100,7100]);
 assert.equal(result.subtotal,14700);
 assert.equal(result.selection.pao,2);
});
test('the new pricing migration preserves old order values, stock and completed revenue',async t=>{
 const db=await fixture(t),oldCart=validateCart([first],{},catalog),input=order(oldCart);
 await db.prepare('INSERT INTO prices(count,value) VALUES(3,1300)').run();
 await reserveOrder(db,input,oldCart.lines);
 for(const status of ['preparo','entrega','concluido']) await db.prepare('UPDATE orders SET status=? WHERE id=?').bind(status,input.id).run();
 const migration=readFileSync(new URL('../drizzle-pg/0010_burger_pricing.sql',import.meta.url),'utf8');
 await db.prepare(migration).run();
 const rows=(await db.prepare('SELECT count,value FROM prices ORDER BY count').all()).results;
 assert.equal(rows.length,17);
 assert.deepEqual(rows[0],{count:3,value:1400});
 assert.deepEqual(rows.at(-1),{count:19,value:3000});
 const saved=await db.prepare('SELECT subtotal,total,burgers FROM orders WHERE id=?').bind(input.id).first();
 assert.equal(saved.subtotal,1300);
 assert.equal(saved.total,1800);
 assert.deepEqual(JSON.parse(saved.burgers),oldCart.snapshots);
 assert.equal((await db.prepare('SELECT value FROM finance WHERE order_id=?').bind(input.id).first()).value,1800);
 assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='carne'").first()).stock,29);
 const currentCatalog={...catalog,prices:Object.fromEntries(rows.map(row=>[row.count,row.value]))};
 assert.equal(validateCart([first],{},currentCatalog).subtotal,1400);
 assert.equal(validateCart([second],{},currentCatalog).subtotal,1500);
});
test('quantity creates independent drafts with one included bread and preserves only the requested recipes',()=>{
 const initial=resizeBurgerDrafts([],3);
 assert.deepEqual(initial,[{pao:1},{pao:1},{pao:1}]);
 initial[0].carne=2;
 assert.equal(initial[1].carne,undefined);
 const original=[first,second], expanded=resizeBurgerDrafts(original,3);
 assert.deepEqual(expanded,[first,second,{pao:1}]);
 expanded[0].carne=4;
 assert.equal(original[0].carne,1);
 assert.deepEqual(resizeBurgerDrafts(expanded,1),[expanded[0]]);
 for(const quantity of [0,-1,11,2.5,NaN])assert.throws(()=>resizeBurgerDrafts(original,quantity));
 assert.equal(resizeBurgerDrafts([],10).length,10);
});
test('sequential assembly advances one burger at a time and only completes after the last confirmation',()=>{
 const drafts=resizeBurgerDrafts([],3), signatures=[];
 assert.equal(nextUnfinishedBurger(drafts,signatures),0);
 for(let index=0;index<3;index++){
  drafts[index]={...first};
  signatures[index]=JSON.stringify(drafts[index]);
  assert.equal(nextUnfinishedBurger(drafts,signatures,index),index<2?index+1:-1);
 }
 assert.equal(nextUnfinishedBurger(drafts,signatures),-1);
 assert.ok(drafts.every((draft,index)=>burgerIsFinished(draft,signatures[index])));
 drafts[0]={...drafts[0],queijo:2};
 assert.equal(burgerIsFinished(drafts[0],signatures[0]),false);
 assert.equal(nextUnfinishedBurger(drafts,signatures,2),0);
 assert.equal(nextUnfinishedBurger(drafts,signatures),0);
});
test('repeating a recipe replaces only checked burgers with independent copies, preserving bread and prices',()=>{
 const drafts=[{...first},{...second},{pao:1}], originals=structuredClone(drafts);
 const copies=repeatBurgerRecipe(drafts,0,[2],catalog);
 assert.deepEqual(copies,[first,second,first]);
 assert.deepEqual(drafts,originals);
 assert.equal(summarizeCart(copies,{},catalog).subtotal,4000);
 copies[2].queijo=3;
 assert.equal(copies[0].queijo,1);
 assert.equal(drafts[2].queijo,undefined);
 const all=repeatBurgerRecipe([{...heavy},{pao:1},{pao:1}],0,[1,2,2],catalog);
 assert.deepEqual(validateCart(all,{refri:1},catalog).selection,{pao:3,carne:12,queijo:6,refri:1});
 assert.equal(validateCart(all,{refri:1},catalog).subtotal,5500);
});
test('repeating checks combined stock before returning any changes, including paused ingredients and bread',()=>{
 const drafts=[{...first},{pao:1},{pao:1}], original=structuredClone(drafts);
 for(const [id,stock] of [['carne',2],['pao',2]]){
  const scarce={...catalog,ingredients:catalog.ingredients.map(i=>({...i,stock:i.id===id?stock:30}))};
  assert.throws(()=>repeatBurgerRecipe(drafts,0,[1,2],scarce),e=>e instanceof InsufficientStockError&&e.shortages.some(item=>item.id===id));
  assert.deepEqual(drafts,original);
 }
 const paused={...catalog,ingredients:catalog.ingredients.map(i=>({...i,active:i.id!=='queijo'}))};
 assert.throws(()=>repeatBurgerRecipe(drafts,0,[1],paused),InsufficientStockError);
});
test('repeating rejects incomplete recipes, accompaniments and invalid destinations',()=>{
 const drafts=[{...first},{pao:1}];
 for(const source of [-1,2,1.5])assert.throws(()=>repeatBurgerRecipe(drafts,source,[1],catalog));
 for(const targets of [[],[0],[2],[-1],[1.5]])assert.throws(()=>repeatBurgerRecipe(drafts,0,targets,catalog));
 assert.throws(()=>repeatBurgerRecipe(drafts,1,[0],catalog));
 assert.throws(()=>repeatBurgerRecipe([{...first,refri:1},{pao:1}],0,[1],catalog),/separadamente/);
});
function order(cart, id=crypto.randomUUID()) {return {id,idempotencyKey:id,fingerprint:'multi-burger',code:'TESTE',customer:'TESTE',phone:'00000000000',address:'Sem entrega',reference:'Teste automatizado',notes:'Não produzir',createdAt:1792587477367,subtotal:cart.subtotal,deliveryFee:500,total:cart.subtotal+500,burgers:JSON.stringify(cart.snapshots)};}
async function fixture(t){const db=await postgresFixture(t);await db.batch(catalog.ingredients.map(i=>db.prepare('INSERT INTO ingredients(id,name,category,unit,stock,max_qty,price,featured) VALUES(?,?,?,?,?,?,?,?)').bind(i.id,i.name,i.category,i.unit,i.stock,i.maxQty,i.price,i.featured?1:0)));return db;}

test('each burger has its own price band, recipe and bread, plus shared sides and one delivery fee',()=>{
 const result=validateCart([first,second],{refri:2},catalog);
 assert.equal(result.subtotal,4100); assert.equal(result.subtotal+catalog.deliveryFee,4600);
 assert.deepEqual(result.snapshots.map(b=>b.price),[1300,1400]);
 assert.deepEqual(result.selection,{pao:2,carne:3,queijo:3,bacon:1,refri:2});
 assert.equal(result.lines.filter(i=>i.id==='pao').length,2);
 assert.equal(first.carne,1);
 assert.equal(summarizeCart([first,{}],{},catalog).valid,false);
 for(const invalid of [[],Array(11).fill(first),[null],[{...first,pao:0}],[{...first,carne:5}],[{...first,refri:1}]]) assert.throws(()=>validateCart(invalid,{},catalog));
 for(const invalid of [{carne:1},{refri:-1},{refri:1.5},{refri:5}])assert.throws(()=>validateCart([first],invalid,catalog));
});

test('combined stock shortages include every burger and side before reserving',()=>{
 const scarce={...catalog,ingredients:catalog.ingredients.map(i=>({...i,stock:i.id==='pao'?1:i.id==='carne'?2:i.id==='refri'?0:30}))};
 assert.throws(()=>validateCart([first,second],{refri:1},scarce),e=>e instanceof InsufficientStockError&&e.shortages.length===3&&e.shortages.find(i=>i.id==='carne').requested===3);
 const paused={...catalog,ingredients:catalog.ingredients.map(i=>({...i,active:i.id!=='queijo'}))};
 assert.throws(()=>validateCart([first,second],{},paused),e=>e instanceof InsufficientStockError&&e.shortages[0].requested===3);
});

test('multi-burger reservations preserve recipes and historical prices, cancel all portions once and never duplicate revenue',async t=>{
 const db=await fixture(t),cart=validateCart([heavy,heavy],{refri:2},catalog,["Ana","Bruno"]),input=order(cart);
 await reserveOrder(db,input,cart.lines);
 assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='carne'").first()).stock,22);
 assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='pao'").first()).stock,28);
 assert.deepEqual(JSON.parse((await db.prepare('SELECT burgers FROM orders WHERE id=?').bind(input.id).first()).burgers),cart.snapshots);
 await assert.rejects(reserveOrder(db,input,cart.lines),/unique/i);
 for(let i=0;i<2;i++)await db.prepare("UPDATE orders SET status='cancelado' WHERE id=?").bind(input.id).run();
 assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='carne'").first()).stock,30);
 assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='pao'").first()).stock,30);
 const completed=order(cart);await reserveOrder(db,completed,cart.lines);
 await db.prepare('INSERT INTO prices(count,value) VALUES(6,9999)').run();
 for(const status of ['preparo','entrega','concluido','concluido'])await db.prepare('UPDATE orders SET status=? WHERE id=?').bind(status,completed.id).run();
 assert.equal((await db.prepare('SELECT count(*) AS count FROM finance').first()).count,1);
 assert.equal((await db.prepare('SELECT value FROM finance').first()).value,completed.total);
 assert.deepEqual(JSON.parse((await db.prepare('SELECT burgers FROM orders WHERE id=?').bind(completed.id).first()).burgers).map(b=>b.price),[1600,1600]);
});

test('a stale multi-burger cart rolls back every line if another customer takes the remaining bread',async t=>{
 const db=await fixture(t),cart=validateCart([first,second],{},catalog);
 await db.prepare("UPDATE ingredients SET stock=1 WHERE id='pao'").run();
 await assert.rejects(reserveOrder(db,order(cart),cart.lines),/constraint/i);
 for(const table of ['orders','order_items','movements','finance'])assert.equal((await db.prepare(`SELECT count(*) AS count FROM ${table}`).first()).count,0);
 assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='carne'").first()).stock,30);
});

test('recipient names are trimmed, checked independently of recipes and preserved in snapshots',()=>{
  assert.deepEqual(validateBurgerRecipients(undefined,1),['']);
  assert.throws(()=>validateBurgerRecipients(undefined,2,true),/cada hambúrguer/);
  for(const invalid of [[],['Ana'],['Ana','  '],['Ana',7],['Ana','x'.repeat(61)],['Ana','B\nC']]) assert.throws(()=>validateCart([first,second],{},catalog,invalid));
  const named=validateCart([first,second],{},catalog,['  Ana  ','Bruno']);
  assert.deepEqual(named.snapshots.map(b=>b.recipient),['Ana','Bruno']);
  const original=validateCart([first,second],{},catalog);
  assert.equal(named.subtotal,original.subtotal);
  assert.deepEqual(named.lines,original.lines);
  assert.equal(validateCart([first],{},catalog).snapshots[0].recipient,undefined);
});
