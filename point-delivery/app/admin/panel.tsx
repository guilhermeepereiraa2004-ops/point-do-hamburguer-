"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Bell, BellOff, Check, Hamburger, LayoutDashboard, Pause, Play, Pencil, X } from 'lucide-react';
import { money, type Catalog, type Order } from '@/domain/menu';
import { AdminApiError, readAdminResponse } from '@/lib/admin-api-response';
import "./availability.css";
import "./management.css";
import "./admin-design.css";
import "./admin-mobile.css";
import { OrderBoard } from "./order-board";
import { AdminNavigation, adminSectionLabel, type AdminSection } from "./admin-navigation";
import { ManagementDialog, Overview, FinanceView, ProductCatalogView, type Receipt } from "./management-panels";
import { CustomerView } from './customer-view';
import type { CustomerProfile, MonthlyReport } from "@/domain/reporting";
import type { ManualEntry } from "@/domain/management";

type Dashboard={orders:Order[];customers:CustomerProfile[];catalog:Catalog;finance:Receipt[];manualFinance:ManualEntry[];report:MonthlyReport;movements:{id:number;ingredientId:string;delta:number;reason:string;createdAt:number}[]};
const pageHeadings:Record<AdminSection,{title:string;description:string}>={dashboard:{title:'Visão geral',description:'As vendas e o movimento do seu point, em um só lugar.'},pedidos:{title:'Pedidos',description:'Acompanhe cada etapa, da chegada à entrega.'},estoque:{title:'Estoque',description:'Confira os saldos, reponha ingredientes e controle a disponibilidade.'},cardapio:{title:'Cardápio',description:'Cadastre seus produtos e escolha os que aparecem nos acompanhamentos.'},precos:{title:'Preços do cardápio',description:'Atualize os valores e preserve o histórico das suas vendas.'},clientes:{title:'Clientes',description:'Consulte os contatos e o histórico de compras dos seus clientes.'},financeiro:{title:'Financeiro',description:'Acompanhe o caixa e registre suas entradas e saídas.'}};
const dates=(n:number)=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Bahia',dateStyle:'short',timeStyle:'short'}).format(n);
export default function AdminPanel(){
 const [data,setData]=useState<Dashboard|null>(null),[tab,setTab]=useState<AdminSection>('dashboard'),[busy,setBusy]=useState(false);
 const [connectionIssue,setConnectionIssue]=useState<{message:string; signIn:boolean}|null>(null);
 const [notice,setNotice]=useState<{message:string; error:boolean}|null>(null);
 const connection=data!==null && connectionIssue===null;
 const [edit,setEdit]=useState<{kind:string;id?:string;label:string;value:number|null}|null>(null),[enabled,setEnabled]=useState(false),[unseen,setUnseen]=useState<string[]>([]);
 const [stockSearch,setStockSearch]=useState('');
 const headingRef=useRef<HTMLHeadingElement>(null);
 function navigate(section:AdminSection){
   setTab(section);
   window.scrollTo({top:0,behavior:'instant'});
   requestAnimationFrame(()=>headingRef.current?.focus({preventScroll:true}));
 }
 const audio=useRef<AudioContext|null>(null),ack=useRef<Set<string>>(new Set());
 const loadSequence=useRef(0), appliedLoad=useRef(0);
 const load=useCallback(async()=>{
   const sequence=++loadSequence.current;
   const fallback='Não foi possível atualizar o painel. Tentando reconectar…';
   try {
     const response=await fetch('/api/admin',{cache:'no-store',redirect:'manual'});
     const payload=await readAdminResponse(response,fallback);
     if (!Array.isArray(payload.orders) || !payload.catalog || !payload.report || !Array.isArray(payload.finance) ||
       !Array.isArray(payload.customers) || !Array.isArray(payload.manualFinance) || !Array.isArray(payload.movements)) throw new Error(fallback);
     const dashboard=payload as Dashboard;
     if(sequence<appliedLoad.current)return;
     appliedLoad.current=sequence;
     setUnseen(dashboard.orders.filter(order=>order.status==='recebido'&&!ack.current.has(order.id)).map(order=>order.id));
     setData(dashboard);
     setConnectionIssue(null);
   } catch(error) {
     if(sequence<appliedLoad.current)return;
     appliedLoad.current=sequence;
     const signIn=error instanceof AdminApiError && (error.redirected || error.status===401 || error.status===403);
     setConnectionIssue({message:signIn?'Sua sessão não dá acesso ao painel. Entre novamente.':fallback,signIn});
   }
 },[]);
 useEffect(()=>{try{ack.current=new Set(JSON.parse(localStorage.getItem('point-ack')||'[]'));}catch{}void load();const timer=setInterval(()=>void load(),5000);return()=>clearInterval(timer);},[load]);
 function bell(){const ctx=audio.current;if(!ctx||ctx.state!=='running')return;[1050,1580,2100].forEach((frequency,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(.22/(i+1),ctx.currentTime+.012);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+1.7);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+1.8);});}
 useEffect(()=>{if(!enabled||!unseen.length)return;bell();const t=setInterval(bell,4000);return()=>clearInterval(t);},[enabled,unseen.join(',')]);
 function acknowledge(ids:string[]){ids.forEach(id=>ack.current.add(id));localStorage.setItem('point-ack',JSON.stringify([...ack.current]));setUnseen(s=>s.filter(id=>!ids.includes(id)));}
 async function mutate(input:Record<string,unknown>){
   if(busy)return 'Aguarde a operação atual.';
   setBusy(true);setNotice(null);
   const fallback='Não foi possível confirmar a alteração. Confira os dados do painel antes de tentar novamente.';
   try {
     const response=await fetch('/api/admin',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
     const payload=await readAdminResponse(response,fallback);
     if(payload.ok!==true)throw new Error(fallback);
     if(input.kind==='status')acknowledge([String(input.id)]);
     setEdit(null);
     await load();
     const message=input.kind==='featured'?(input.value?'Produto incluído nos acompanhamentos.':'Produto retirado dos acompanhamentos.'):
       input.kind==='availability'?(input.value?'Ingrediente liberado no cardápio.':'Ingrediente pausado no cardápio.'):'Alteração salva.';
     setNotice({message,error:false});
     return null;
   }catch(error){
     const message=error instanceof AdminApiError?error.message:fallback;
     setNotice({message,error:true});
     return message;
   }finally{setBusy(false);}
 }
 async function toggleSound(){if(enabled){setEnabled(false);return;}try{audio.current||=new AudioContext();await audio.current.resume();setEnabled(true);bell();}catch{setNotice({message:'Não foi possível ativar o áudio. Verifique o navegador.',error:true});}}
 function save(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const value=Number(String(f.get('value')).replace(',','.'));void mutate({kind:edit?.kind,id:edit?.id,value:edit?.kind==='stock'?value:Math.round(value*100),reason:f.get('reason')});}
 const pending=data?.orders.filter(o=>!['concluido','cancelado'].includes(o.status))||[];
 const stockItems=(data?.catalog.ingredients||[]).filter(item=>item.category!=='Complementos'&&item.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').includes(stockSearch.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim()));
 return <div className="admin-app workspace-admin">
 <AdminNavigation current={tab} pending={pending.length} connected={connection} onNavigate={navigate}/>
 <main className="admin-main">
  <header className="admin-topbar">
   <span className="workspace-breadcrumb"><span className="admin-topbar-icon"><LayoutDashboard size={17} aria-hidden="true"/></span> Gestão <span className="admin-breadcrumb-divider">/</span><b>{adminSectionLabel(tab)}</b></span>
   <div className="workspace-mobile-title"><span className="workspace-brand-icon"><Hamburger size={21} aria-hidden="true"/></span><span><small>Point do Hambúrguer</small><strong>{adminSectionLabel(tab)}</strong></span></div>
   <div className="admin-topbar-actions"><span className={connection?"admin-status is-connected":"admin-status"}><i/>{connection?"Atualizado ao vivo":"Reconectando"}</span><button type="button" onClick={toggleSound} aria-pressed={enabled} aria-label="Sineta de pedidos" className={enabled?"sound-button enabled":"sound-button"}>{enabled?<Bell size={16} aria-hidden="true"/>:<BellOff size={16} aria-hidden="true"/>}<span>{enabled?"Sineta ativada":"Ativar sineta"}</span></button></div>
  </header>
  <div className="admin-content"><div className="admin-page-title"><div className="eyebrow">POINT DO HAMBÚRGUER</div><h1 ref={headingRef} tabIndex={-1}>{pageHeadings[tab].title}</h1><p>{pageHeadings[tab].description}</p></div>
 {connectionIssue&&<div className="notice error" role="status"><span>{connectionIssue.message} {connectionIssue.signIn&&<a href="/sign-in">Entrar no painel</a>}</span></div>}
 {notice&&<div className={`notice${notice.error?' error':''}`} role="status">{notice.message}<button onClick={()=>setNotice(null)} aria-label="Dispensar aviso"><X size={13}/></button></div>}
 {unseen.length>0&&<div className="new-order-alert"><Bell size={22}/><div><strong>{unseen.length} pedido{unseen.length>1?'s novos':' novo'} no point!</strong><p>{enabled?'A sineta toca até você reconhecer o alerta.':'Ative a sineta para receber o aviso sonoro.'}</p></div><button className="button primary" onClick={()=>acknowledge(unseen)}><Check size={15}/> Estou ciente</button></div>}
 {!data?<div className="loading-state">{connectionIssue?(connectionIssue.signIn?'Aguardando acesso ao painel.':'Aguardando conexão com o painel…'):'Carregando seu painel…'}</div>:<>
 {tab==='dashboard'&&<Overview report={data.report}/>}
 {tab==='cardapio'&&<ProductCatalogView items={data.catalog.ingredients.filter(i=>i.category==='Complementos')} busy={busy} mutate={mutate} adjustStock={item=>setEdit({kind:'stock',id:item.id,label:'Ajustar '+item.name,value:item.stock})}/>}
 {tab==='pedidos'&&<OrderBoard orders={data.orders} busy={busy} onAdvance={async (order, status)=>await mutate({kind:'status',id:order.id,value:status})===null} onCancel={order=>setEdit({kind:'cancel',id:order.id,label:`Cancelar #${order.code}`,value:0})}/>}
 {tab==='estoque'&&<><div className="admin-section-top"><h2>Ingredientes do hambúrguer</h2><span className="admin-help">Saldos em unidades e porções</span></div><p className="admin-stock-hint">Pause um ingrediente para deixá-lo indisponível no cardápio. O saldo do estoque é preservado.</p><label className="admin-search">Buscar ingrediente<input type="search" value={stockSearch} onChange={event=>setStockSearch(event.target.value)} placeholder="Ex.: carne, queijo ou pão"/></label>{!stockItems.length&&<p className="admin-search-empty" role="status">Nenhum ingrediente encontrado.</p>}<div className="table-scroll"><table className="admin-table stock-table"><thead><tr><th>Ingrediente</th><th>Categoria</th><th>Saldo</th><th>Disponibilidade</th><th/></tr></thead><tbody>{stockItems.map(i=><tr key={i.id}><td><strong>{i.name}</strong><small>{i.unit}</small></td><td>{i.category}</td><td className="stock-number">{i.stock}</td><td><span className={`stock-tag ${!i.active?'paused':i.stock===0?'empty':i.stock<=i.lowStock?'low':''}`}>{!i.active?'Pausado':i.stock===0?'Sem estoque':i.stock<=i.lowStock?'Estoque baixo':'Disponível'}</span></td><td><div className="stock-actions"><button type="button" className={`availability-action ${i.active?'':'is-paused'}`} disabled={busy} aria-label={`${i.active?'Pausar':'Liberar'} ${i.name}`} onClick={()=>void mutate({kind:'availability',id:i.id,value:!i.active})}>{i.active?<Pause size={13}/>:<Play size={13}/>} {i.active?'Pausar':'Liberar'}</button><button className="table-edit" disabled={busy} aria-label={`Ajustar estoque de ${i.name}`} onClick={()=>setEdit({kind:'stock',id:i.id,label:`Ajustar ${i.name}`,value:i.stock})}><Pencil size={14}/> Ajustar</button></div></td></tr>)}</tbody></table></div><h2 className="history-title">Últimas movimentações</h2><div className="movement-list">{!data.movements.length?<p>Nenhuma movimentação ainda.</p>:data.movements.map(m=><div key={m.id}><span>{data.catalog.ingredients.find(i=>i.id===m.ingredientId)?.name}<small>{m.reason.startsWith('Pedido ')?'Saída por pedido':m.reason}</small></span><b className={m.delta>=0?'positive':'negative'}>{m.delta>0?'+':''}{m.delta}</b><time>{dates(m.createdAt)}</time></div>)}</div></>}
 {tab==='precos'&&<><div className="price-admin-grid"><section className="admin-box"><h2>Tabela do hambúrguer</h2><p>O pão está incluso. Cada repetição conta como um item.</p>{Object.entries(data.catalog.prices).map(([n,v])=><div className="price-admin-row" key={n}><span>{n} itens</span><b>{money(v)}</b><button aria-label={`Editar preço de ${n} itens`} onClick={()=>setEdit({kind:'price',id:n,label:`Preço para ${n} itens`,value:v})}><Pencil size={14}/></button></div>)}</section><div><section className="admin-box"><h2>Taxa de entrega</h2><p>Valor fixo somado ao total de cada pedido.</p><div className="fee-value">{data.catalog.deliveryFee===null?'Não configurada':money(data.catalog.deliveryFee)}</div><button className="button primary" onClick={()=>setEdit({kind:'delivery',label:'Taxa de entrega',value:data.catalog.deliveryFee})}><Pencil size={14}/> Configurar entrega</button></section><section className="admin-box extras-admin"><h2>Preços dos acompanhamentos</h2><p>Edite sabores, tamanhos e valores na área de Cardápio.</p><button className="button primary" onClick={()=>setTab('cardapio')}>Gerenciar cardápio <ArrowRight size={14}/></button></section></div></div></>}
 {tab==='clientes'&&<CustomerView customers={data.customers}/>}
 {tab==='financeiro'&&<FinanceView receipts={data.finance} manual={data.manualFinance} month={data.report.month} busy={busy} mutate={mutate}/>}
 </>}</div></main>
 {edit&&<ManagementDialog title={edit.label} busy={busy} onClose={()=>setEdit(null)}>{edit.kind==='cancel'?<><p>O pedido será cancelado e os ingredientes voltarão ao estoque. Essa ação não pode ser desfeita.</p><button className="button primary" disabled={busy} onClick={()=>void mutate({kind:'status',id:edit.id,value:'cancelado'})}>Confirmar cancelamento</button></>:<form onSubmit={save}><label>{edit.kind==='stock'?'Novo saldo':'Valor em reais'}<input name="value" type="number" min="0" max={edit.kind==='stock'?1000000:10000} step={edit.kind==='stock'?'1':'0.01'} defaultValue={edit.value===null?'':edit.kind==='stock'?edit.value:edit.value/100} required/></label>{edit.kind==='stock'&&<label>Motivo do ajuste<input name="reason" placeholder="Ex.: reposição de ingredientes" minLength={3} maxLength={200} required/></label>}<button className="button primary" disabled={busy}>{busy?'Salvando…':'Salvar alteração'}<Check size={16}/></button></form>}</ManagementDialog>}
 </div>;
}
