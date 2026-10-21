import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {createAuth} from '../lib/auth-config.ts';
import {postgresDatabase} from '../db/postgres-adapter.ts';
import {adminAccess} from '../db/admin-access.ts';
const base='https://point.example';
async function fixture(t){
 const client=new PGlite();t.after(()=>client.close());
 await client.exec(readFileSync(new URL('../drizzle-pg/0002_admin_auth.sql',import.meta.url),'utf8'));
 const connection={release(){},async query(sql,values){const result=await client.query(sql,values);return {rows:result.rows,rowCount:result.affectedRows||result.rows.length,command:sql.trim().split(/\s/)[0].toUpperCase()};}};
 const pool={async connect(){return connection;},async end(){}};
 const secret='test-only-secret-with-at-least-32-characters';
 const auth=createAuth(pool,secret,{baseURL:base,trustedOrigins:[base]});
 const provision=createAuth(pool,secret,{baseURL:base,provision:true,trustedOrigins:[base]});
 const store=postgresDatabase({query:query=>connection.query(query.sql,query.values),transaction:queries=>client.transaction(async tx=>{const results=[];for(const q of queries)results.push(await tx.query(q.sql,q.values));return results;})});
 return {client,auth,provision,store,second:createAuth(pool,secret,{baseURL:base,trustedOrigins:[base]})};
}
function request(auth,path,body,cookie='',origin=base){return auth.handler(new Request(base+'/api/auth'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)}));}
test('own authentication denies public signup, hashes passwords, checks roles and revokes sessions',async t=>{
 const {client,auth,provision,store}=await fixture(t);
 const input={email:'admin@point.local',username:'admin',name:'Administrador de teste',password:'TesteAutenticacao!2026'};
 const denied=await request(auth,'/sign-up/email',input);assert.ok(denied.status>=400);
 const created=await provision.api.signUpEmail({body:input});
 assert.equal(await adminAccess(store,created.user.id),null);
 const stored=(await client.query('SELECT password FROM auth_account')).rows[0].password;
 assert.notEqual(stored,input.password);assert.ok(stored.length>50);
 await client.query('INSERT INTO admin_access(user_id) VALUES($1)',[created.user.id]);
 assert.deepEqual(await adminAccess(store,created.user.id),{mustChangePassword:true});
 const login=await request(auth,'/sign-in/username',{username:'admin',password:input.password});assert.equal(login.status,200);
 const cookies=login.headers.getSetCookie();assert.ok(cookies.some(c=>/HttpOnly/i.test(c)&&/Secure/i.test(c)&&/SameSite=Lax/i.test(c)));
 const cookie=cookies.map(c=>c.split(';')[0]).join('; ');
 const session=await auth.api.getSession({headers:new Headers({cookie})});assert.equal(session.user.id,created.user.id);
 const forged=await auth.api.getSession({headers:new Headers({cookie:cookie+'tampered'})});assert.equal(forged,null);
 const csrf=await request(auth,'/sign-out',{},cookie,'https://attacker.example');assert.equal(csrf.status,403);
 const changed=await request(auth,'/change-password',{currentPassword:input.password,newPassword:'NovaSenhaValida!2026',revokeOtherSessions:true},cookie);assert.equal(changed.status,200);
 assert.equal(await auth.api.getSession({headers:new Headers({cookie})}),null);
 await client.query('UPDATE admin_access SET must_change_password=0 WHERE user_id=$1',[created.user.id]);assert.deepEqual(await adminAccess(store,created.user.id),{mustChangePassword:false});
 await client.query('UPDATE admin_access SET active=0 WHERE user_id=$1',[created.user.id]);assert.equal(await adminAccess(store,created.user.id),null);
 const old=await request(auth,'/sign-in/username',{username:'admin',password:input.password});assert.equal(old.status,401);
});
test('login attempts are limited persistently across application instances',async t=>{
 const {auth,second}=await fixture(t);let response;
 for(let i=0;i<6;i++)response=await request(i<3?auth:second,'/sign-in/username',{username:'unknown',password:'NoValidPassword!2026'});
 assert.equal(response.status,429);
});
