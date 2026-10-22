import test from "node:test";
import assert from "node:assert/strict";
import { hasValidRequestOrigin } from "../lib/request-origin.ts";
const request=(url,origin)=>new Request(url,{headers:origin===undefined?{}:{Origin:origin}});

test("development accepts localhost and 127.0.0.1 only on the same HTTP port",()=>{
  for(const [host,other] of [["localhost","127.0.0.1"],["127.0.0.1","localhost"]]){
    assert.equal(hasValidRequestOrigin(request(`http://${host}:4178/api/orders`,`http://${other}:4178`),{development:true}),true);
    for(const origin of [`http://${other}:5173`,`https://${other}:4178`,"http://localhost.attacker.example:4178","http://192.168.0.2:4178","null","malformed",`http://${other}:4178/`,`http://user@${other}:4178`])assert.equal(hasValidRequestOrigin(request(`http://${host}:4178/api/orders`,origin),{development:true}),false);
  }
});
test("production stays exact-origin and never trusts forwarded headers for cross-origin requests",()=>{
  assert.equal(hasValidRequestOrigin(request("https://point.example/api/orders","https://point.example"),{development:false}),true);
  for(const origin of ["https://attacker.example","http://point.example","https://sub.point.example","https://point.example:444"]){
    const req=request("https://point.example/api/orders",origin);
    req.headers.set("x-forwarded-host",new URL(origin).host);
    req.headers.set("x-forwarded-proto",new URL(origin).protocol.slice(0,-1));
    assert.equal(hasValidRequestOrigin(req,{development:false}),false);
  }
  assert.equal(hasValidRequestOrigin(request("http://localhost:4178/api/orders","http://127.0.0.1:4178"),{development:false}),false);
  assert.equal(hasValidRequestOrigin(request("https://point.example/api/orders"),{development:false}),true);
  assert.equal(hasValidRequestOrigin(request("https://point.example/api/admin/password"),{development:false,allowMissing:false}),false);
});
