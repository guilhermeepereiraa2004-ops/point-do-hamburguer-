import './admin-design.css';
import { isAdmin } from '@/actions/admin';
import { chatGPTSignInPath } from '@/app/chatgpt-auth';
import AdminPanel from './panel';
import { Hamburger, ArrowLeft, ShieldCheck } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default async function AdminPage(){
 if(!await isAdmin()) return <main className="admin-login"><a href="/" className="login-back"><ArrowLeft size={16}/> Voltar ao cardápio</a><div className="login-card"><span className="brand-mark"><Hamburger size={30}/></span><div className="eyebrow">POINT DO HAMBÚRGUER</div><h1>Seu point de controle.</h1><p>Pedidos, ingredientes e resultados em um só lugar.</p><a className="button primary" href={chatGPTSignInPath('/admin')} target="_top"><ShieldCheck size={17}/> Entrar no painel</a><small>Prévia localhost: o acesso usa uma identidade local de teste. Em produção, apenas administradores autorizados.</small></div></main>;
 return <AdminPanel/>;
}
