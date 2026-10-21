"use client";
import { useState, type FormEvent } from "react";
import { KeyRound, Check, ArrowLeft } from "lucide-react";
export function AdminPassword({ requiredChange }: { requiredChange: boolean }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy)return;
    const data = new FormData(event.currentTarget);
    if(data.get('newPassword')!==data.get('confirmPassword')) { setError('As novas senhas precisam ser iguais.'); return; }
    setBusy(true);setError('');
    try {
      const response=await fetch('/api/admin/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:data.get('currentPassword'),newPassword:data.get('newPassword')})});
      if(!response.ok) { const body=await response.json() as {error?:string};setError(body.error||'Confira a senha atual e tente novamente.'); }
      else window.location.assign('/admin');
    } catch {setError('Não foi possível salvar agora. Tente novamente.');} finally {setBusy(false);}
  }
  return <main className="admin-login">{!requiredChange&&<a className="login-back" href="/admin"><ArrowLeft size={16}/> Voltar ao painel</a>}<section className="login-card"><span className="brand-mark"><KeyRound size={28}/></span><div className="eyebrow">SUA CONTA</div><h1>{requiredChange?'Crie sua senha.':'Alterar senha.'}</h1><p>{requiredChange?'Substitua a senha temporária antes de acessar a administração.':'Escolha uma senha exclusiva para o seu painel.'}</p><form className="own-auth-form" onSubmit={submit}><label>{requiredChange?'Senha temporária':'Senha atual'}<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128}/></label><label>Nova senha<input name="newPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password" required/></label><label>Confirme a nova senha<input name="confirmPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password" required/></label><small>Use pelo menos 12 caracteres. Evite repetir uma senha de outro serviço.</small>{error&&<p className="notice error" role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy?'Salvando…':'Salvar minha senha'}<Check size={17}/></button></form></section></main>;
}
