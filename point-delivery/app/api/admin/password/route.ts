import { headers } from 'next/headers';
import { getAdminIdentity } from '@/actions/admin';
import { getAuth } from '@/lib/auth';
import { getStore } from '@/db';
import { hasValidRequestOrigin } from '@/lib/request-origin';
export async function POST(request:Request){
  if(!hasValidRequestOrigin(request,{allowMissing:false}))return Response.json({error:'Origem inválida.'},{status:403});
  if(Number(request.headers.get('content-length')||0)>2000)return Response.json({error:'Solicitação inválida.'},{status:413});
  const identity=await getAdminIdentity();
  if(!identity)return Response.json({error:'Acesso restrito.'},{status:403});
  try{
    const input=await request.json() as Record<string,unknown>;
    if(!input||typeof input!=='object'||Array.isArray(input))return Response.json({error:'Solicitação inválida.'},{status:400});
    if(typeof input.newPassword!=='string'||input.newPassword.length<12||input.newPassword.length>128||typeof input.currentPassword!=='string'||input.currentPassword===input.newPassword)return Response.json({error:'Escolha uma nova senha diferente, com 12 a 128 caracteres.'},{status:400});
    const changed=await getAuth().api.changePassword({asResponse:true,headers:await headers(),body:{currentPassword:input.currentPassword,newPassword:input.newPassword,revokeOtherSessions:true}});
    if(!changed.ok)return Response.json({error:'Confira a senha atual e tente novamente.'},{status:400});
    await getStore().prepare('UPDATE admin_access SET must_change_password=0 WHERE user_id=? AND active=1').bind(identity.user.id).run();
    const response=Response.json({ok:true});
    for(const cookie of changed.headers.getSetCookie())response.headers.append('Set-Cookie',cookie);
    return response;
  }catch{return Response.json({error:'Confira a senha atual e tente novamente.'},{status:400});}
}
