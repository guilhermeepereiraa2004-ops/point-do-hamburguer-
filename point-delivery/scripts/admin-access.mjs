import { Pool } from "pg";
import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { createAuth } from "../lib/auth-config.ts";
import { mkdirSync,writeFileSync } from "node:fs";
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:2});
try {
  const {rows:existing}=await pool.query("SELECT user_id FROM admin_access WHERE active=1");
  const password=randomBytes(24).toString('base64url');
  let id=existing[0]?.user_id;
  if(existing.length&&!process.argv.includes('--reset')) { console.log('Administrador já cadastrado. Nenhuma credencial alterada.'); process.exitCode=0; }
  else {
    if(!id) {
      const auth=createAuth(pool,process.env.BETTER_AUTH_SECRET,{provision:true,baseURL:'http://localhost:4178'});
      const result=await auth.api.signUpEmail({body:{name:'Administrador',email:'admin@point.local',username:'admin',password}});
      id=result.user.id;
    }
    const client=await pool.connect();
    try { await client.query('BEGIN'); await client.query("UPDATE auth_account SET password=$1 WHERE \"userId\"=$2 AND \"providerId\"='credential'",[await hashPassword(password),id]); await client.query('DELETE FROM auth_session WHERE "userId"=$1',[id]); await client.query('INSERT INTO admin_access(user_id,active,must_change_password) VALUES($1,1,1) ON CONFLICT(user_id) DO UPDATE SET active=1,must_change_password=1',[id]); await client.query('COMMIT'); }
    catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
    mkdirSync('.sites-runtime',{recursive:true});
    writeFileSync('.sites-runtime/acesso-inicial-admin.txt',`Point do Hambúrguer — acesso inicial\n\nUsuário: admin\nSenha temporária: ${password}\n\nEntre em /sign-in. O sistema exigirá uma nova senha de pelo menos 12 caracteres antes de liberar o painel.\nNão compartilhe este arquivo. Após a troca, esta senha deixa de funcionar.\n`);
    console.log('Acesso inicial salvo em arquivo local ignorado. Troca de senha obrigatória no primeiro acesso.');
  }
}finally{await pool.end();}
