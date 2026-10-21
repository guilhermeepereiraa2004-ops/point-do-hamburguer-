"use client";
import { useState, type FormEvent } from "react";
import { Hamburger, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
export function AdminLogin() {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget); setBusy(true); setError("");
    try {
      const result = await authClient.signIn.username({ username: String(data.get("username")).trim(), password: String(data.get("password")) });
      if (result.error) setError(result.error.status === 429 ? "Muitas tentativas. Aguarde um minuto e tente novamente." : "Usuário ou senha incorretos.");
      else window.location.assign("/admin");
    } catch { setError("Não foi possível entrar agora. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <main className="admin-login"><a href="/" className="login-back"><ArrowLeft size={16}/> Voltar ao cardápio</a><section className="login-card"><span className="brand-mark"><Hamburger size={30}/></span><div className="eyebrow">POINT DO HAMBÚRGUER</div><h1>Seu point de controle.</h1><p>Entre para acompanhar os pedidos e cuidar do seu negócio.</p><form className="own-auth-form" onSubmit={submit}><label>Usuário<input name="username" autoComplete="username" autoCapitalize="none" maxLength={40} required/></label><label>Senha<input name="password" type="password" autoComplete="current-password" maxLength={128} required/></label>{error&&<p role="alert" className="notice error">{error}</p>}<button className="button primary" disabled={busy}>{busy?"Entrando…":"Entrar no painel"}<ArrowRight size={17}/></button></form><small><ShieldCheck size={13}/> Acesso exclusivo à administração. Não há cadastro público.</small></section></main>;
}
