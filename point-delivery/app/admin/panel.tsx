"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Bell, Check, Hamburger, LayoutDashboard, Pause, Play, Pencil, X } from 'lucide-react';
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
import { useOrderSound } from "./use-order-sound";
import { PushNotifications } from "./push-notifications";
import type { CustomerProfile, MonthlyReport } from "@/domain/reporting";
import type { ManualEntry } from "@/domain/management";

type Dashboard={orders:Order[];customers:CustomerProfile[];catalog:Catalog;finance:Receipt[];manualFinance:ManualEntry[];report:MonthlyReport;movements:{id:number;ingredientId:string;delta:number;reason:string;createdAt:number}[]};
const pageHeadings:Record<AdminSection,{title:string;description:string}>={dashboard:{title:'Visão geral',description:'As vendas e o movimento do seu point, em um só lugar.'},pedidos:{title:'Pedidos',description:'Acompanhe cada etapa, da chegada à entrega.'},estoque:{title:'Estoque',description:'Confira os saldos, reponha ingredientes e controle a disponibilidade.'},cardapio:{title:'Cardápio',description:'Cadastre seus produtos e escolha os que aparecem nos acompanhamentos.'},precos:{title:'Preços do cardápio',description:'Atualize os valores e preserve o histórico das suas vendas.'},clientes:{title:'Clientes',description:'Consulte os contatos e o histórico de compras dos seus clientes.'},financeiro:{title:'Financeiro',description:'Acompanhe o caixa e registre suas entradas e saídas.'},notificacoes:{title:'Notificações',description:'Configure a sineta e gerencie os aparelhos que recebem avisos de pedidos.'}};
const dates=(n:number)=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Bahia',dateStyle:'short',timeStyle:'short'}).format(n);
export default function AdminPanel(){
 const [data,setData]=useState<Dashboard|null>(null),[tab,setTab]=useState<AdminSection>('dashboard'),[busy,setBusy]=useState(false);
 const [connectionIssue,setConnectionIssue]=useState<{message:string; signIn:boolean}|null>(null);
 const [notice,setNotice]=useState<{message:string; error:boolean}|null>(null);
 const connection=data!==null && connectionIssue===null;
 const [edit,setEdit]=useState<{kind:string;id?:string;label:string;value:number|null}|null>(null),[unseen,setUnseen]=useState<string[]>([]);
 const { enabled, ready: soundReady, error: soundError, toggleSound, unlockSound } = useOrderSound(unseen);
 const [stockSearch,setStockSearch]=useState('');
 const [stockGroup,setStockGroup]=useState('todos');
 const headingRef=useRef<HTMLHeadingElement>(null);
 const navigationVersion=useRef(0);
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('section')==='pedidos')setTab('pedidos');},[]);
 useEffect(()=>{
   if(!notice||notice.error)return;
   const timer=window.setTimeout(()=>setNotice(current=>current===notice?null:current),5000);
   return ()=>window.clearTimeout(timer);
 },[notice]);
 function navigate(section:AdminSection){
   if(section!==tab){
     navigationVersion.current++;
     setNotice(null);
   }
   setTab(section);
   window.scrollTo({top:0,behavior:'instant'});
   requestAnimationFrame(()=>headingRef.current?.focus({preventScroll:true}));
 }
 const ack=useRef<Set<string>>(new Set());
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
 useEffect(()=>{
   const refresh=()=>{if(document.visibilityState==='visible')void load();};
   const pushed=(event:MessageEvent)=>{if(event.data?.type==='POINT_NEW_ORDER')void load();};
   window.addEventListener('online',refresh);window.addEventListener('focus',refresh);window.addEventListener('pageshow',refresh);
   document.addEventListener('visibilitychange',refresh);navigator.serviceWorker?.addEventListener('message',pushed);
   return()=>{window.removeEventListener('online',refresh);window.removeEventListener('focus',refresh);window.removeEventListener('pageshow',refresh);document.removeEventListener('visibilitychange',refresh);navigator.serviceWorker?.removeEventListener('message',pushed);};
 },[load]);
 function acknowledge(ids:string[]){ids.forEach(id=>ack.current.add(id));localStorage.setItem('point-ack',JSON.stringify([...ack.current]));setUnseen(s=>s.filter(id=>!ids.includes(id)));}
 async function mutate(input:Record<string,unknown>){
   if(busy)return 'Aguarde a operação atual.';
   const sourceNavigation=navigationVersion.current;
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
     if(sourceNavigation===navigationVersion.current)setNotice({message,error:false});
     return null;
   }catch(error){
     const message=error instanceof AdminApiError?error.message:fallback;
     if(sourceNavigation===navigationVersion.current)setNotice({message,error:true});
     return message;
   }finally{setBusy(false);}
 }
 function save(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const value=Number(String(f.get('value')).replace(',','.'));void mutate({kind:edit?.kind,id:edit?.id,value:edit?.kind==='stock'?value:Math.round(value*100),reason:f.get('reason')});}
 const pending=data?.orders.filter(o=>!['concluido','cancelado'].includes(o.status))||[];
 const stockItems=(data?.catalog.ingredients||[]).filter(item=>(stockGroup==='todos'||(stockGroup==='acompanhamentos'?item.category==='Complementos':item.category!=='Complementos'))&&item.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').includes(stockSearch.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim()));
 return <div className="admin-app workspace-admin">
 <AdminNavigation current={tab} pending={pending.length} connected={connection} onNavigate={navigate}/>
 <main className="admin-main">
  <header className="admin-topbar">
   <span className="workspace-breadcrumb"><span className="admin-topbar-icon"><LayoutDashboard size={17} aria-hidden="true"/></span> Gestão <span className="admin-breadcrumb-divider">/</span><b>{adminSectionLabel(tab)}</b></span>
   <div className="workspace-mobile-title"><span className="workspace-brand-icon"><Hamburger size={21} aria-hidden="true"/></span><span><small>Point do Hambúrguer</small><strong>{adminSectionLabel(tab)}</strong></span></div>
   <div className="admin-topbar-actions"><span className={connection?"admin-status is-connected":"admin-status"}><i/>{connection?"Atualizado ao vivo":"Reconectando"}</span></div>
  </header>
  <div className="admin-content"><div className="admin-page-title"><div className="eyebrow">POINT DO HAMBÚRGUER</div><h1 ref={headingRef} tabIndex={-1}>{pageHeadings[tab].title}</h1><p>{pageHeadings[tab].description}</p></div>
 {connectionIssue&&<div className="notice error" role="status"><span>{connectionIssue.message} {connectionIssue.signIn&&<a href="/sign-in">Entrar no painel</a>}</span></div>}
 {notice&&<div className={`notice${notice.error?' error':''}`} role="status">{notice.message}<button onClick={()=>setNotice(null)} aria-label="Dispensar aviso"><X size={13}/></button></div>}
 {unseen.length>0&&<div className="new-order-alert"><Bell size={22}/><div><strong>{unseen.length} pedido{unseen.length>1?'s novos':' novo'} no point!</strong><p>{enabled?(soundReady?'A sineta toca até você reconhecer o alerta.':'Toque no painel para liberar o aviso sonoro.'):'Ative a sineta em Notificações para ouvir os próximos avisos.'}</p></div><button className="button primary" onClick={()=>acknowledge(unseen)}><Check size={15}/> Estou ciente</button></div>}
 <div hidden={tab!=='notificacoes'}>
   <section className="push-settings" aria-labelledby="order-sound-title">
     <div className="push-settings-description">
       <Bell size={22} aria-hidden="true"/>
       <div><h2 id="order-sound-title">Sineta de pedidos</h2><p>Ouça um aviso quando chegar um pedido com o painel aberto.</p></div>
     </div>
     <div className="push-settings-actions">
       <button type="button" onClick={enabled?unlockSound:toggleSound}>{enabled?(soundReady?'Testar sineta':'Liberar som'):'Ativar sineta'}</button>
       {enabled&&<button type="button" onClick={toggleSound}>Desativar sineta</button>}
     </div>
     {enabled&&<p className="push-settings-message" role="status">{soundReady?'Sineta ativada neste navegador.':'Sineta ativada. Toque no painel para liberar o som neste navegador.'}</p>}
     {soundError&&<div className="notice error" role="status">{soundError}</div>}
   </section>
   {/* Keep the worker check active on panel visits, even outside this section. */}
   <PushNotifications/>
 </div>
 {tab!=='notificacoes'&&(!data?<div className="loading-state">{connectionIssue?(connectionIssue.signIn?'Aguardando acesso ao painel.':'Aguardando conexão com o painel…'):'Carregando seu painel…'}</div>:<>
 {tab==='dashboard'&&<>
   <section className="store-status-control" aria-label="Funcionamento da loja"><div><strong><i data-open={data.catalog.storeOpen!==false}/>{data.catalog.storeOpen===false?'Loja fechada':'Loja aberta'}</strong><p>{data.catalog.storeOpen===false?'O cardápio está disponível, mas novos pedidos estão pausados.':'Recebendo pedidos. Fechar a loja não interrompe os pedidos já recebidos.'}</p></div><button type="button" className="button primary" disabled={busy||!connection} onClick={()=>void mutate({kind:'store-status',value:data.catalog.storeOpen===false})}>{busy?'Salvando…':data.catalog.storeOpen===false?'Abrir loja':'Fechar loja'}</button></section>
   <Overview report={data.report}/>
 </>}
 {tab==='cardapio'&&<ProductCatalogView items={data.catalog.ingredients.filter(i=>i.category==='Complementos')} busy={busy} mutate={mutate} adjustStock={item=>setEdit({kind:'stock',id:item.id,label:'Ajustar '+item.name,value:item.stock})}/>}
 {tab==='pedidos'&&<OrderBoard orders={data.orders} busy={busy} onAdvance={async (order, status)=>await mutate({kind:'status',id:order.id,value:status})===null} onCancel={order=>setEdit({kind:'cancel',id:order.id,label:`Cancelar #${order.code}`,value:0})}/>}
 {tab==='estoque'&&<><div className="admin-section-top"><h2>Estoque da loja</h2><span className="admin-help">Saldos em unidades e porções</span></div><p className="admin-stock-hint">Pause um produto para deixá-lo indisponível no cardápio. O saldo do estoque é preservado.</p><div className="stock-group-filters" role="group" aria-label="Filtrar estoque">{[["todos","Todos"],["ingredientes","Ingredientes"],["acompanhamentos","Acompanhamentos"]].map(([id,label])=><button type="button" key={id} aria-pressed={stockGroup===id} onClick={()=>setStockGroup(id)}>{label}</button>)}</div><label className="admin-search">Buscar produto<input type="search" value={stockSearch} onChange={event=>setStockSearch(event.target.value)} placeholder="Ex.: carne, batata ou Coca-Cola"/></label>{!stockItems.length&&<p className="admin-search-empty" role="status">Nenhum produto encontrado.</p>}<div className="table-scroll"><table className="admin-table stock-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Saldo</th><th>Disponibilidade</th><th/></tr></thead><tbody>{stockItems.map(i=><tr key={i.id}><td><strong>{i.name}</strong><small>{i.unit}</small></td><td>{i.category}</td><td className="stock-number">{i.stock}</td><td><span className={`stock-tag ${!i.active?'paused':i.stock===0?'empty':i.stock<=i.lowStock?'low':''}`}>{!i.active?'Pausado':i.stock===0?'Sem estoque':i.stock<=i.lowStock?'Estoque baixo':'Disponível'}</span></td><td><div className="stock-actions"><button type="button" className={`availability-action ${i.active?'':'is-paused'}`} disabled={busy} aria-label={`${i.active?'Pausar':'Liberar'} ${i.name}`} onClick={()=>void mutate({kind:'availability',id:i.id,value:!i.active})}>{i.active?<Pause size={13}/>:<Play size={13}/>} {i.active?'Pausar':'Liberar'}</button><button className="table-edit" disabled={busy} aria-label={`Ajustar estoque de ${i.name}`} onClick={()=>setEdit({kind:'stock',id:i.id,label:`Ajustar ${i.name}`,value:i.stock})}><Pencil size={14}/> Ajustar</button></div></td></tr>)}</tbody></table></div><h2 className="history-title">Últimas movimentações</h2><div className="movement-list">{!data.movements.length?<p>Nenhuma movimentação ainda.</p>:data.movements.map(m=><div key={m.id}><span>{data.catalog.ingredients.find(i=>i.id===m.ingredientId)?.name}<small>{m.reason.startsWith('Pedido ')?'Saída por pedido':m.reason}</small></span><b className={m.delta>=0?'positive':'negative'}>{m.delta>0?'+':''}{m.delta}</b><time>{dates(m.createdAt)}</time></div>)}</div></>}
 {tab==='precos'&&<><div className="price-admin-grid"><section className="admin-box"><h2>Tabela do hambúrguer</h2><p>O pão está incluso. Cada repetição conta como um item. Acima da última faixa, cada item acrescenta R$ 1,00.</p>{Object.entries(data.catalog.prices).map(([n,v])=><div className="price-admin-row" key={n}><span>{n} itens</span><b>{money(v)}</b><button aria-label={`Editar preço de ${n} itens`} onClick={()=>setEdit({kind:'price',id:n,label:`Preço para ${n} itens`,value:v})}><Pencil size={14}/></button></div>)}</section><div><section className="admin-box"><h2>Taxa de entrega</h2><p>Valor fixo somado ao total de cada pedido.</p><div className="fee-value">{data.catalog.deliveryFee===null?'Não configurada':money(data.catalog.deliveryFee)}</div><button className="button primary" onClick={()=>setEdit({kind:'delivery',label:'Taxa de entrega',value:data.catalog.deliveryFee})}><Pencil size={14}/> Configurar entrega</button></section><section className="admin-box extras-admin"><h2>Preços dos acompanhamentos</h2><p>Edite sabores, tamanhos e valores na área de Cardápio.</p><button className="button primary" onClick={()=>navigate('cardapio')}>Gerenciar cardápio <ArrowRight size={14}/></button></section></div></div></>}
 {tab==='clientes'&&<CustomerView customers={data.customers}/>}
 {tab==='financeiro'&&<FinanceView receipts={data.finance} manual={data.manualFinance} month={data.report.month} busy={busy} mutate={mutate}/>}
 </>)}</div></main>
 {edit&&<ManagementDialog title={edit.label} busy={busy} onClose={()=>setEdit(null)}>{edit.kind==='cancel'?<><p>O pedido será cancelado e os ingredientes voltarão ao estoque. Essa ação não pode ser desfeita.</p><button className="button primary" disabled={busy} onClick={()=>void mutate({kind:'status',id:edit.id,value:'cancelado'})}>Confirmar cancelamento</button></>:<form onSubmit={save}><label>{edit.kind==='stock'?'Novo saldo':'Valor em reais'}<input name="value" type="number" min="0" max={edit.kind==='stock'?1000000:10000} step={edit.kind==='stock'?'1':'0.01'} defaultValue={edit.value===null?'':edit.kind==='stock'?edit.value:edit.value/100} required/></label>{edit.kind==='stock'&&<label>Motivo do ajuste<input name="reason" placeholder="Ex.: reposição de ingredientes" minLength={3} maxLength={200} required/></label>}<button className="button primary" disabled={busy}>{busy?'Salvando…':'Salvar alteração'}<Check size={16}/></button></form>}</ManagementDialog>}
 </div>;
}
