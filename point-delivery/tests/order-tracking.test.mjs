import test from "node:test";
import assert from "node:assert/strict";
import { orderConfirmation, trackingToken, trackingResponse } from "../lib/order-tracking.ts";
import { readOrderProgress } from "../db/order-tracking.ts";
import { reserveOrder } from "../db/order-reservation.ts";
import { postgresFixture } from "./postgres-fixture.mjs";

const secret = "test-only-tracking-key-not-used-by-the-application";
const request = token => new Request("https://point.example/api/orders/test", { headers: token ? { Authorization: `Bearer ${token}` } : {} });

test("private tracking links are stable on retry, bound to one order and never include the idempotency key", () => {
  const a = { id: crypto.randomUUID(), code: "ONE", idempotencyKey: "private-idempotency-value" }, b = { id: crypto.randomUUID(), code: "TWO" };
  assert.deepEqual(orderConfirmation(a,secret),orderConfirmation(a,secret));
  const link=orderConfirmation(a,secret).trackingUrl;
  assert.ok(link.startsWith(`/pedido/${a.id}#acesso=`));
  assert.ok(!link.includes(a.idempotencyKey));
  assert.notEqual(trackingToken(a.id,secret),trackingToken(b.id,secret));
  assert.notEqual(trackingToken(a.id,secret),trackingToken(a.id,secret+"other"));
  assert.throws(()=>trackingToken(a.id,"short"));
});

test("missing, modified and cross-order tokens cannot read data; successful tracking strips personal fields and disables cache", async () => {
  const id=crypto.randomUUID(), token=trackingToken(id,secret); let reads=0;
  const read=async()=>{reads++;return {code:"ONE",status:"preparo",total:1800,createdAt:123,customer:"PRIVATE",phone:"PRIVATE",address:"PRIVATE",idempotencyKey:"PRIVATE",fingerprint:"PRIVATE"};};
  for(const candidate of [undefined,"x",trackingToken(crypto.randomUUID(),secret),(token[0]==="A"?"B":"A")+token.slice(1)]){
    const response=await trackingResponse(request(candidate),id,secret,read);
    assert.equal(response.status,404);
  }
  assert.equal((await trackingResponse(request(token),"bad-id",secret,read)).status,404);
  assert.equal(reads,0);
  const response=await trackingResponse(request(token),id,secret,read);
  assert.deepEqual(await response.json(),{code:"ONE",status:"preparo",total:1800,createdAt:123});
  assert.match(response.headers.get("cache-control"),/no-store/);
  assert.equal(response.headers.get("referrer-policy"),"no-referrer");
  assert.equal((await trackingResponse(request(token),id,secret,async()=>null)).status,404);
  const failed=await trackingResponse(request(token),id,secret,async()=>{throw new Error("private database detail");});
  assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes("private database detail"));
});

test("tracking reads the admin status source through preparation, delivery, completion and cancellation without changing reservations",async t=>{
  const db=await postgresFixture(t);
  await db.prepare("INSERT INTO ingredients(id,name,category,unit,stock,max_qty) VALUES ('carne','Carne','Proteínas','unidade',10,4)").run();
  const input={id:crypto.randomUUID(),idempotencyKey:crypto.randomUUID(),fingerprint:"fixture",code:"TESTE",customer:"CLIENTE FICTICIO",phone:"00000000000",address:"Sem entrega real",reference:"Teste",notes:"Não produzir",subtotal:1300,deliveryFee:500,total:1800,createdAt:1792520000123};
  await reserveOrder(db,input,[{id:"carne",name:"Carne",quantity:1}]);
  const url=orderConfirmation(input,secret).trackingUrl,token=new URLSearchParams(url.split("#")[1]).get("acesso");
  for(const status of ["recebido","preparo","entrega","concluido"]){
    if(status!=="recebido")await db.prepare("UPDATE orders SET status=? WHERE id=?").bind(status,input.id).run();
    const response=await trackingResponse(request(token),input.id,secret,id=>readOrderProgress(db,id));
    assert.deepEqual(await response.json(),{code:"TESTE",status,total:1800,createdAt:input.createdAt});
    assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='carne'").first()).stock,9);
  }
  assert.equal((await db.prepare("SELECT count(*) AS count FROM finance").first()).count,1);
  const cancelled={...input,id:crypto.randomUUID(),idempotencyKey:crypto.randomUUID()};
  await reserveOrder(db,cancelled,[{id:"carne",name:"Carne",quantity:1}]);
  await db.prepare("UPDATE orders SET status='cancelado' WHERE id=?").bind(cancelled.id).run();
  const response=await trackingResponse(request(trackingToken(cancelled.id,secret)),cancelled.id,secret,id=>readOrderProgress(db,id));
  assert.equal((await response.json()).status,"cancelado");
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='carne'").first()).stock,9);
});
