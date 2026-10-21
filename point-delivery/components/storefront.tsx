"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Check, CheckCircle2, ChefHat, ChevronRight, CupSoda, Flame, Hamburger, Leaf, MapPin, Minus, Plus, ShoppingBag, Sparkles, X } from "lucide-react";
import { accompanimentChoices, countItems, getStockShortages, isIngredientAvailable, money, summarize, type StockShortage, type Ingredient, type Selection } from "@/domain/menu";
import { BurgerPreview, IngredientPhoto } from "@/components/burger-preview";
import { StockAvailability } from "@/components/stock-availability";
import { IngredientAvailability } from "@/components/ingredient-availability";
import { useCatalog } from "@/components/use-catalog";
import "@/app/storefront.css";
import "@/app/hero.css";
import "@/app/assembly-flow.css";
import { combineSelections, MAX_BURGERS, summarizeCart } from "@/domain/cart";
import { AccompanimentMenu } from "@/components/accompaniment-menu";
import { HeroArtwork, HeroDivider } from "@/components/hero-artwork";
import { BurgerQuantity } from "@/components/burger-quantity";
import { burgerIsFinished, nextUnfinishedBurger, repeatBurgerRecipe, resizeBurgerDrafts } from "@/domain/assembly-flow";
import { RepeatBurger } from "@/components/repeat-burger";
const hints: Record<string,string> = {"carne-hamburguer":"O clássico que não tem erro",frango:"Macio e cheio de sabor",queijo:"Derretido no ponto certo",cheddar:"Cremosidade de respeito",catupiry:"Um toque extra de cremosidade",bacon:"Crocante de verdade",ovo:"Aquele reforço especial",presunto:"Combina com tudo",calabresa:"Um toque de personalidade",salsicha:"Sabor de infância","milho-verde":"Docinho e suculento",ervilha:"Um verdinho a mais",cebola:"Sabor em cada mordida",salada:"Alface e tomate fresquinhos","batata-palha":"O croc final"};
function Counter({item,value,onChange,disabled=false}:{item:Ingredient;value:number;onChange:(n:number)=>void;disabled?:boolean}) {return <div className={`counter ${value?"has-value":""}`}><button type="button" aria-label={`Remover ${item.name}`} disabled={disabled||!value} onClick={()=>onChange(-1)}><Minus size={15}/></button><span aria-live="polite">{value}</span><button type="button" aria-label={`Adicionar ${item.name}`} disabled={disabled||value>=Math.min(item.maxQty,item.stock)||!isIngredientAvailable(item)} aria-describedby={`availability-${item.id}`} onClick={()=>onChange(1)}><Plus size={15}/></button></div>;}
export default function Home({fontVariant="atual"}:{fontVariant?:"atual"|"poppins"}){
 const {catalog,setCatalog,loading,loadError,loadCatalog}=useCatalog();
 const [burgers,setBurgers]=useState<Selection[]>([{pao:1}]);
 const [activeBurger,setActiveBurger]=useState(0),[extras,setExtras]=useState<Selection>({});
 const selection=burgers[activeBurger];
 const [step,setStep]=useState(0),[category,setCategory]=useState("Todos");
 const [completedSignatures,setCompletedSignatures]=useState<string[]>([]);
 const [extrasChoice,setExtrasChoice]=useState<"yes"|"no"|null>(null);
 const controlsRef=useRef<HTMLDivElement|null>(null);
 const [checkout,setCheckout]=useState(false),[sending,setSending]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState(""); const keyRef=useRef("");
 const [checkoutDraft,setCheckoutDraft]=useState<Record<string,string>>({});
 const [closedSignature,setClosedSignature]=useState<string|null>(null),[closing,setClosing]=useState(false);
 const [motionOverride,setMotionOverride]=useState(false),[systemReducedMotion,setSystemReducedMotion]=useState(false);
 useEffect(()=>{const media=window.matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setSystemReducedMotion(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update);},[]);
 const previewRef=useRef<HTMLElement|null>(null),finishTimer=useRef<number|null>(null);
 const selectionSignature=JSON.stringify(selection),burgerClosed=closedSignature===selectionSignature;
 useEffect(()=>()=>{if(finishTimer.current!==null)window.clearTimeout(finishTimer.current);},[]);
 useEffect(()=>{if(!checkout&&!success)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";const close=(e:KeyboardEvent)=>{if(e.key==="Escape"&&!sending){setCheckout(false);setSuccess("");}};window.addEventListener("keydown",close);return()=>{document.body.style.overflow=old;window.removeEventListener("keydown",close);};},[checkout,success,sending]);
 const summary=summarize(selection,catalog),cart=summarizeCart(burgers,extras,catalog),total=cart.subtotal+(catalog.deliveryFee??0),count=countItems(selection,catalog),selected=catalog.ingredients.filter(i=>selection[i.id]);
 const unavailable=getStockShortages(combineSelections([...burgers,extras]),catalog);
 const accompaniments=accompanimentChoices(catalog.ingredients,extras);
 const otherSelections=combineSelections(burgers.filter((_,index)=>index!==activeBurger));
 const currentShortages=getStockShortages(selection,{...catalog,ingredients:catalog.ingredients.map(item=>({...item,stock:Math.max(0,item.stock-(otherSelections[item.id]||0))}))});
 const bread=catalog.ingredients.find(item=>item.id==="pao");
 const quantityLimit=bread&&isIngredientAvailable(bread)?Math.min(MAX_BURGERS,bread.stock):0;
 const finished=burgers.map((burger,index)=>burgerIsFinished(burger,completedSignatures[index]));
 const allBurgersFinished=finished.every(Boolean);
 const unfinished=nextUnfinishedBurger(burgers,completedSignatures);
 const nextBurger=nextUnfinishedBurger(burgers,completedSignatures,activeBurger);
 const canFinishBurger=summary.burgerPrice!==undefined&&selection.pao===1&&currentShortages.length===0&&!loading&&!closing;
 const canReview=allBurgersFinished&&cart.valid&&extrasChoice!==null&&unavailable.length===0&&!loading&&!closing;
 const finishLabel=nextBurger>=0?"Próximo hambúrguer":"Finalizar montagem";
 function focusStage(){window.requestAnimationFrame(()=>{controlsRef.current?.scrollIntoView({behavior:systemReducedMotion?"auto":"smooth",block:"start"});controlsRef.current?.querySelector<HTMLHeadingElement>("h3")?.focus({preventScroll:true});});}
 function goToStep(next:number){
  if(closing||sending||next===2&&(!allBurgersFinished||!cart.valid)||next===1&&(loading||burgers.length>quantityLimit))return;
  setStep(next);setCheckout(false);setCategory("Todos");
  if(next===1){if(unfinished>=0)setActiveBurger(unfinished);setClosedSignature(null);}
  if(next===2)setClosedSignature(selectionSignature);
  focusStage();
 }
 function editBurger(index:number){if(closing||sending)return;setActiveBurger(index);setStep(1);setCategory("Todos");setClosedSignature(null);setCheckout(false);focusStage();}
 function setQuantity(quantity:number){
  if(quantity>quantityLimit||closing||sending)return;
  setBurgers(current=>resizeBurgerDrafts(current,quantity));
  setCompletedSignatures(current=>current.slice(0,quantity));setActiveBurger(current=>Math.min(current,quantity-1));setClosedSignature(null);keyRef.current="";
 }
 function setSelection(update:(current:Selection)=>Selection){setBurgers(current=>current.map((burger,index)=>index===activeBurger?update(burger):burger));keyRef.current="";}
 function repeatCurrentRecipe(targets:number[]){
  if(closing||sending||loading)return false;
  const copies=repeatBurgerRecipe(burgers,activeBurger,targets,catalog);
  setBurgers(copies);
  setCompletedSignatures(current=>current.map((signature,index)=>targets.includes(index)?"":signature));
  keyRef.current="";
  return true;
 }
 function change(item:Ingredient,delta:number){
  item=catalog.ingredients.find(product=>product.id===item.id)??item;
  if(item.category==="Complementos")setExtras(current=>({...current,[item.id]:Math.max(0,Math.min(item.maxQty,item.stock,(current[item.id]||0)+delta))}));
  else setSelection(current=>({...current,[item.id]:Math.max(0,Math.min(item.maxQty,Math.max(0,item.stock-(otherSelections[item.id]||0)),(current[item.id]||0)+delta))}));
  keyRef.current="";
 }
 function startCheckout(){
  if(closing||sending||loading)return;
  if(step===0){focusStage();return;}
  if(!allBurgersFinished||!cart.valid){if(unfinished>=0)editBurger(unfinished);else goToStep(1);return;}
  if(step!==2||extrasChoice===null){goToStep(2);return;}
  if(unavailable.length)return;
  setError("");setCheckout(true);void loadCatalog(true);
 }
 function finishBurger(){
  if(!canFinishBurger)return;
  setError("");
  const reduceMotion=systemReducedMotion&&!motionOverride;
  const bounds=previewRef.current?.getBoundingClientRect();
  const needsScroll=!window.matchMedia("(max-width:760px)").matches&&bounds&&(bounds.top < -40||bounds.bottom > window.innerHeight+40);
  setClosing(true);
  if(needsScroll)previewRef.current?.scrollIntoView({behavior:reduceMotion?"auto":"smooth",block:"center"});
  finishTimer.current=window.setTimeout(()=>{
   setClosedSignature(selectionSignature);
   finishTimer.current=window.setTimeout(()=>{
    setCompletedSignatures(current=>{const signatures=[...current];signatures[activeBurger]=selectionSignature;return signatures;});
    setClosing(false);finishTimer.current=null;
    if(nextBurger>=0){setActiveBurger(nextBurger);setClosedSignature(null);setCategory("Todos");setStep(1);}else{setStep(2);void loadCatalog(true);}
    focusStage();
   },reduceMotion?180:1150);
  },reduceMotion?0:needsScroll?550:0);
 }
 async function send(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(sending)return;if(!canReview){setCheckout(false);if(!allBurgersFinished)goToStep(1);else goToStep(2);return;}setSending(true);setError("");
  const form=new FormData(e.currentTarget);keyRef.current||=crypto.randomUUID();
  try{
   const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:keyRef.current,burgers,extras,expectedTotal:total,...Object.fromEntries(form)})});
   const data=await r.json() as {error?:string;code:string;shortages?:StockShortage[]};
   if(!r.ok){
    await loadCatalog();
    if(data.code==="INSUFFICIENT_STOCK"&&data.shortages?.length){setCatalog(current=>({...current,ingredients:current.ingredients.map(item=>{const missing=data.shortages?.find(i=>i.id===item.id);return missing?{...item,stock:missing.available}:item;})}));return;}
    throw new Error(data.error);
   }
   setCheckout(false);setSuccess(data.code);setCheckoutDraft({});setBurgers([{pao:1}]);setCompletedSignatures([]);setExtrasChoice(null);setStep(0);setExtras({});setActiveBurger(0);setClosedSignature(null);keyRef.current="";
  }catch(e){setError(e instanceof Error?e.message:"Falha de conexão. Tente novamente.");}finally{setSending(false);}
 }

 return <div className={`storefront${fontVariant==="poppins"?" font-poppins":""}`}><header className="site-header"><div className="container header-inner"><a className="brand" href={fontVariant==="poppins"?"/poppins":"/"} aria-label="Point do Hambúrguer, início"><span className="brand-mark"><Hamburger size={29} strokeWidth={2.3}/></span><span>point<span className="brand-small">DO HAMBÚRGUER</span></span><span className="brand-dot">®</span></a><nav className="desktop-nav"><a href="#montar" className="active">Monte seu burger</a><a href="#como-funciona">Como funciona</a></nav><button className="bag-button" onClick={startCheckout} disabled={closing}><ShoppingBag size={18}/><span>Meu pedido</span><b>{burgers.length}</b></button></div></header>
 <main><section className="hero container"><div className="hero-copy"><div className="eyebrow"><span/> SEU BURGER, SUAS REGRAS</div><h1><span className="hero-line">Do seu jeito.</span><span className="hero-line">Até a última</span><span className="hero-line hero-accent">camada.<svg className="title-spark" viewBox="0 0 70 70" fill="none"><path d="m34 3 3 22 18-13-12 20 23 6-24 3 12 20-19-14-5 20-3-23L6 55l14-19L1 29l23-1-9-20 17 15z" stroke="currentColor" strokeWidth="3"/></svg></span></h1><p>Escolha os ingredientes. Capriche nos favoritos.<br className="desktop-br"/> O próximo burger é a sua criação.</p><a href="#montar" className="button primary hero-cta"><span className="hero-cta-label"><Hamburger size={21} aria-hidden="true"/>Montar meu burger</span><span className="hero-cta-arrow" aria-hidden="true"><ArrowRight size={21}/></span></a><div className="hero-proof"><span><ChefHat size={18}/> Feito na hora</span><i/><span><Flame size={18}/> Sabor sem limites</span></div></div>
 <HeroArtwork price={money(Object.values(catalog.prices).length?Math.min(...Object.values(catalog.prices)):1300)}/></section>
 <HeroDivider/>

 <section id="montar" className="builder-section container">
  <div className="section-heading"><div><div className="eyebrow">ESCOLHA. COMBINE. CAPRICHE.</div><h2>Seu burger. <span>Sua criação.</span></h2></div><p>Um pedido. Cada lanche do seu jeito.</p></div>
  <div className={`builder-layout${step===0?" is-quantity-step":""}`}>
   {step>0&&<aside className="preview-card" ref={previewRef} aria-busy={closing}>
    <div className="preview-heading"><span><Sparkles size={16}/> SUA CRIAÇÃO, AO VIVO</span><span className="live-dot">{closing?"FINALIZANDO":burgerClosed?"FINALIZADO":"EM MONTAGEM"}</span></div>
    <BurgerPreview selection={selection} closed={burgerClosed} closing={closing} forceMotion={motionOverride} onMotionChange={systemReducedMotion?()=>setMotionOverride(value=>!value):undefined} onViewChange={closed=>setClosedSignature(closed?selectionSignature:null)}/>
    <div className="preview-caption"><h3>{step===2?"Seus lanches estão prontos.":`Hambúrguer ${activeBurger+1} de ${burgers.length}`}</h3><p>{step===2?"Quer uma bebida ou uma porção para acompanhar?":"Escolha os recheios deste lanche."}</p></div>
    <div className="selected-chips">{selected.filter(i=>i.category!=="Pães").map(i=><span key={i.id}>{selection[i.id]}× {i.name}<button aria-label={`Retirar ${i.name}`} disabled={closing||step!==1} onClick={()=>setSelection(s=>({...s,[i.id]:0}))}><X size={12}/></button></span>)}</div>
    <div className="preview-total"><div><small>{step===2?"Total do pedido":`Hambúrguer ${activeBurger+1} de ${burgers.length}`}</small><strong>{step===2?money(total):summary.burgerPrice===undefined?"—":money(summary.burgerPrice)}</strong></div><span className="preview-included"><Check size={12}/> {step===2?`${burgers.length} lanches prontos`:`${count} itens neste burger`}</span></div>
    <button type="button" className="preview-close-action" onClick={step===1?finishBurger:startCheckout} disabled={step===1?!canFinishBurger:!canReview}><span>{closing?"Fechando seu burger…":step===1?finishLabel:"Continuar para entrega"}</span><ArrowRight size={17}/></button>
    <span className="preview-footnote">{catalog.deliveryFee===null?"Entrega a configurar":`Entrega de ${money(catalog.deliveryFee)} · uma taxa por pedido`}</span>
   </aside>}
   <div className="builder-controls" ref={controlsRef}>
    <div className="steps" role="group" aria-label="Etapas do pedido">{["Quantidade","Montagem","Acompanhamentos"].map((name,index)=><button key={name} className={step===index?"current":""} aria-current={step===index?"step":undefined} disabled={closing||sending||index===1&&(loading||burgers.length>quantityLimit)||index===2&&(!allBurgersFinished||!cart.valid)} onClick={()=>goToStep(index)}><span>{String(index+1).padStart(2,"0")}</span>{name}{index<2&&<ChevronRight size={15}/>}</button>)}</div>
    {loadError&&<div className="notice error" role="alert">{loadError}<button onClick={()=>{void loadCatalog();}}>Tentar novamente</button></div>}
    {loading?<div className="loading-state">Preparando os ingredientes…</div>:<>
     {step===1&&<>
      <div className="assembly-progress" aria-live="polite"><strong>Hambúrguer {activeBurger+1} de {burgers.length}</strong><span>{finished.filter(Boolean).length} de {burgers.length} finalizados</span></div>
      <div className="burger-cart-tabs" role="group" aria-label="Montagens do pedido">{burgers.map((burger,index)=><div key={index} className={`${activeBurger===index?"active":""} ${finished[index]?"is-finished":""}`}><button type="button" aria-label={`Editar hambúrguer ${index+1}`} aria-pressed={activeBurger===index} disabled={closing||!finished[index]&&index!==unfinished&&index!==activeBurger} onClick={()=>editBurger(index)}>{finished[index]?<CheckCircle2 size={16}/>:<Hamburger size={16}/>}<span>Hambúrguer {index+1}<small>{finished[index]?"Finalizado":activeBurger===index?"Em montagem":countItems(burger,catalog)>0?"Revisar receita":"A montar"}</small></span></button></div>)}</div>
     </>}
     <div className="step-title"><div><h3 tabIndex={-1}>{step===0?"Quantos hambúrgueres vão ser?":step===1?`Monte o hambúrguer ${activeBurger+1}.`:"Quer algo para acompanhar?"}</h3><p>{step===0?"Escolha a quantidade. Depois, monte um de cada vez.":step===1?"Escolha de 3 a 15 itens. O pão já está incluído.":"Seus lanches estão prontos. Você decide o que vem junto."}</p></div><span>{step===0?"PRIMEIRO PASSO":step===1?"ATÉ 4× CADA":"OPCIONAL"}</span></div>
     {unavailable.length>0&&<div className="menu-stock-notice" role="status"><strong>A disponibilidade mudou. Revise seu pedido.</strong>{unavailable.map(item=>item.name).join(", ")} — ajuste a quantidade ou os ingredientes para continuar.</div>}
     {step===0&&<BurgerQuantity quantity={burgers.length} available={quantityLimit} onChange={setQuantity} onStart={()=>goToStep(1)}/>}
     {step===1&&<>
      {burgers.length>1&&<RepeatBurger key={`${activeBurger}-${burgers.length}`} burgers={burgers} source={activeBurger} finished={finished} catalog={catalog} disabled={closing||loading||sending} validRecipe={summary.burgerPrice!==undefined&&selection.pao===1&&getStockShortages(selection,catalog).length===0} onApply={repeatCurrentRecipe}/>}
      <div className="category-tabs">{["Todos","Proteínas","Queijos","Extras"].map(c=><button key={c} onClick={()=>setCategory(c)} disabled={closing} className={category===c?"selected":""} aria-pressed={category===c}>{c==="Todos"?<Hamburger size={15}/>:c==="Proteínas"?<Flame size={15}/>:c==="Extras"?<Leaf size={15}/>:null}{c}</button>)}</div>
      <div className="ingredients-grid">{catalog.ingredients.filter(i=>["Proteínas","Queijos","Extras"].includes(i.category)&&(category==="Todos"||i.category===category)).map(item=><div key={item.id} className={`ingredient-card ${selection[item.id]?"is-selected":""} ${!isIngredientAvailable(item)?"sold-out":""}`}><div className="food-icon"><IngredientPhoto id={item.id}/></div>{selection[item.id]>0&&<span className="ingredient-picked" aria-hidden="true"><Check size={11}/></span>}<div className="ingredient-info"><h4>{item.name}</h4><p>{hints[item.id]}</p><IngredientAvailability item={item}/></div><Counter item={{...item,stock:Math.max(0,item.stock-(otherSelections[item.id]||0))}} disabled={closing} value={selection[item.id]||0} onChange={delta=>change(item,delta)}/></div>)}</div>
      <div className="pricing-note"><span><span className="note-icon">!</span> Quanto mais camadas, mais a sua cara.</span><details><summary>Ver tabela de preços <ArrowDown size={13}/></summary><div className="price-table">{Object.entries(catalog.prices).map(([n,p])=><span key={n}>{n} itens <b>{money(p)}</b></span>)}</div></details></div>
      <div className="builder-bottom"><span>{count<3?(count===2?"Falta 1 item para este lanche":`Faltam ${3-count} itens para este lanche`):count>15?"Retire alguns itens: o máximo é 15":<><CheckCircle2 size={16}/> {count} itens · {money(summary.burgerPrice??0)}</>}</span><div className="assembly-actions"><button type="button" className="builder-back" disabled={closing} onClick={()=>goToStep(0)}><ArrowLeft size={14}/> Quantidade</button><button type="button" className="button primary" disabled={!canFinishBurger} onClick={finishBurger}>{closing?"Finalizando…":finishLabel}<ArrowRight size={17}/></button></div></div>
     </>}
     {step===2&&<>
      <div className="side-choice" role="group" aria-label="Escolha de acompanhamentos">
       <button type="button" aria-pressed={extrasChoice==="yes"} onClick={()=>setExtrasChoice("yes")}><CupSoda size={25}/><span><strong>Quero acompanhamentos</strong><small>Escolher bebidas e porções</small></span></button>
       <button type="button" aria-pressed={extrasChoice==="no"} onClick={()=>{setExtrasChoice("no");setExtras({});keyRef.current="";}}><Hamburger size={25}/><span><strong>Só os hambúrgueres</strong><small>Continuar sem acompanhamentos</small></span></button>
      </div>
      {extrasChoice==="yes"&&<AccompanimentMenu items={accompaniments} selection={extras} disabled={closing||sending} onChange={change}/>}
      {extrasChoice==="no"&&<p className="no-sides-message"><CheckCircle2 size={23}/>Tudo certo! Vamos seguir apenas com seus hambúrgueres.</p>}
      <div className="builder-bottom"><span>Total do pedido: <strong>{money(total)}</strong></span><div className="assembly-actions"><button type="button" className="builder-back" onClick={()=>editBurger(activeBurger)}><ArrowLeft size={14}/> Lanches</button><button type="button" className="button primary" disabled={!canReview} onClick={startCheckout}>Continuar para entrega<ArrowRight size={17}/></button></div></div>
     </>}
    </>}
   </div>
  </div>
 </section>
 <section id="como-funciona" className="how-section container"><div><div className="eyebrow">SIMPLES ASSIM</div><h2>Da sua ideia<br/>pra sua mordida.</h2></div><div className="how-item"><span>01</span><h3>Escolha a quantidade</h3><p>Diga quantos hambúrgueres vão no seu pedido.</p></div><div className="how-item"><span>02</span><h3>Monte um de cada vez</h3><p>Escolha os recheios de cada lanche e avance para o próximo.</p></div><div className="how-item"><span>03</span><h3>Complete seu pedido</h3><p>Escolha se quer acompanhamentos e informe onde entregar.</p></div></section></main>
 <footer><div className="container footer-inner"><a className="brand" href={fontVariant==="poppins"?"/poppins":"/"}><span className="brand-mark"><Hamburger size={25}/></span><span>point<span className="brand-small">DO HAMBÚRGUER</span></span></a><span>Seu burger. Seu point.</span><a href="/admin">Área da hamburgueria <ArrowRight size={14}/></a></div></footer>
 {(checkout||success)&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!sending){setCheckout(false);setSuccess("");}}}><section className={`checkout-modal ${success?"checkout-success":""}`} role="dialog" aria-modal="true" aria-labelledby="checkout-title"><div className="checkout-toolbar"><button className="modal-close" aria-label="Fechar" onClick={()=>{setCheckout(false);setSuccess("");}} disabled={sending}><X/></button></div>{success?<div className="success-state"><span><Check size={36}/></span><div className="eyebrow">AGORA É COM A GENTE</div><h2 id="checkout-title">Pedido recebido!</h2><p>Seu pedido <strong>#{success}</strong> chegou à hamburgueria.</p><p>Já estamos de olho na sua criação.</p><button className="button primary" onClick={()=>{setSuccess("");void loadCatalog();}}>Voltar ao cardápio <ArrowRight size={17}/></button></div>:<><header className="checkout-header"><div className="eyebrow"><ShoppingBag size={15}/> SÓ MAIS UM PASSO</div><h2 id="checkout-title">Bora matar essa fome?</h2><p className="modal-description">{burgers.length===1?"Seu burger está pronto.":`${burgers.length} hambúrgueres, cada um do seu jeito.`} Agora, é só dizer onde entregar.</p></header><div className="checkout-layout"><div className="checkout-summary"><div className="checkout-section-heading"><span className="checkout-number">01</span><h3>Seu pedido</h3><button type="button" className="checkout-edit" onClick={()=>{setCheckout(false);document.getElementById("montar")?.scrollIntoView({behavior:"smooth",block:"start"});}}>Editar</button></div><div className="cart-review-burgers">{burgers.map((burger,index)=><article className="cart-review-burger" key={index}><header><div><span>FEITO DO SEU JEITO</span><h4>Hambúrguer {index+1}</h4></div><strong>{cart.summaries[index].burgerPrice===undefined?"Em montagem":money(cart.summaries[index].burgerPrice!)}</strong></header><p>{catalog.ingredients.filter(item=>burger[item.id]).map(item=>`${burger[item.id]}× ${item.name}`).join(" · ")}</p><div><button type="button" onClick={()=>editBurger(index)}>Editar</button></div></article>)}</div><button type="button" className="checkout-add-burger" disabled={sending} onClick={()=>goToStep(0)}><Hamburger size={16}/> Alterar quantidade de hambúrgueres</button>{accompaniments.some(item=>extras[item.id])&&<div className="order-review cart-extras"><h4>Acompanhamentos</h4>{accompaniments.filter(item=>extras[item.id]).map(item=><div key={item.id}><span>{extras[item.id]}× {item.name}</span><b>{money((item.price||0)*extras[item.id])}</b></div>)}</div>}<div className="review-totals"><div><span>Lanches + acompanhamentos</span><b>{cart.valid?money(cart.subtotal):"Revise as montagens"}</b></div><div><span>Entrega</span><b>{catalog.deliveryFee===null?"A configurar":money(catalog.deliveryFee)}</b></div><div className="review-total"><span>Total</span><strong>{money(total)}</strong></div></div>{catalog.deliveryFee===null&&<div className="notice">Prévia local: configure a taxa de entrega em Admin → Preços para testar a finalização.</div>}</div><form className="delivery-form" onSubmit={send} onChange={e=>{keyRef.current="";setCheckoutDraft(Object.fromEntries(Array.from(new FormData(e.currentTarget),([key,value])=>[key,String(value)])));}}><div className="checkout-section-heading"><span className="checkout-number"><MapPin size={16}/></span><h3>Onde vamos entregar?</h3></div><p className="delivery-intro">Preencha seus dados para receber seu burger.</p><div className="form-row"><label>Seu nome<input name="customer" defaultValue={checkoutDraft.customer||""} placeholder="Como podemos te chamar?" required minLength={2} maxLength={100} autoComplete="name"/></label><label>Telefone com DDD<input name="phone" defaultValue={checkoutDraft.phone||""} type="tel" placeholder="(00) 00000-0000" required minLength={10} maxLength={20} autoComplete="tel"/></label></div><label>Endereço completo<input name="address" defaultValue={checkoutDraft.address||""} placeholder="Rua, número, bairro e cidade" required minLength={8} maxLength={300} autoComplete="street-address"/></label><label>Ponto de referência<input name="reference" defaultValue={checkoutDraft.reference||""} placeholder="Um lugar conhecido perto de você" required minLength={2} maxLength={200}/></label><label>Alguma observação?<textarea name="notes" defaultValue={checkoutDraft.notes||""} placeholder="Conte aqui se precisar de algo especial." maxLength={500} rows={2}/></label><StockAvailability items={unavailable} onAdjust={()=>{setCheckout(false);if(unavailable.some(item=>catalog.ingredients.find(product=>product.id===item.id)?.category==="Complementos")){goToStep(2);}else{const index=burgers.findIndex(burger=>unavailable.some(item=>burger[item.id]>0));editBurger(Math.max(0,index));}}}/>{error&&<p className="notice error" role="alert">{error}</p>}<button className="button primary submit-order" disabled={sending||!canReview||catalog.deliveryFee===null}><span>{sending?"Enviando seu pedido…":"Fazer meu pedido"}</span><strong>{money(total)}</strong><ArrowRight size={18}/></button><small className="checkout-footnote">Pagamento combinado diretamente com a hamburgueria.</small></form></div></>}</section></div>}
 </div>;
}

