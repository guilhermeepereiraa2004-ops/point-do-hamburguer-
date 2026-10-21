import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCart, summarizeCart } from '../domain/cart.ts';
import { InsufficientStockError } from '../domain/menu.ts';
import { reserveOrder } from '../db/order-reservation.ts';
import { postgresFixture } from './postgres-fixture.mjs';

const item = (id, category, extra = {}) => ({ id, name: id, category, unit: 'unidade', stock: 30, maxQty: 4, active: true, price: null, ...extra });
const catalog = { ingredients: [item('pao','Pães',{maxQty:1}),item('carne','Proteínas'),item('queijo','Queijos'),item('bacon','Extras'),item('refri','Complementos',{featured:true,extraType:'refrigerante',price:700})], prices:{3:1300,4:1400,6:1600},deliveryFee:500 };
const first = {pao:1,carne:1,queijo:1,bacon:1}, second = {pao:1,carne:2,queijo:2}, heavy = {pao:1,carne:4,queijo:2};
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
 const db=await fixture(t),cart=validateCart([heavy,heavy],{refri:2},catalog),input=order(cart);
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
