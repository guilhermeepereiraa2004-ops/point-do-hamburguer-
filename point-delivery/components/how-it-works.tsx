import { ArrowUpRight, Hamburger, Layers, ShoppingBag } from "lucide-react";
import "@/app/how-it-works.css";

const steps = [
  { icon: Hamburger, title: "Escolha a quantidade", description: "Só pra você ou pra dividir? Diga quantos hambúrgueres vão no pedido." },
  { icon: Layers, title: "Monte do seu jeito", description: "Escolha os recheios de cada lanche. Vale repetir sua combinação favorita." },
  { icon: ShoppingBag, title: "Complete seu pedido", description: "Adicione os acompanhamentos que quiser e conte onde vamos entregar." },
];

export function HowItWorks() {
  return <section id="como-funciona" className="how-card-section container" aria-labelledby="how-heading">
    <div className="how-card-shell">
      <header className="how-card-header"><span className="how-card-label"><span/> É FÁCIL PEDIR</span><h2 id="how-heading">Você imagina.<br/>A gente<br/><em>capricha.</em></h2><p>Da escolha dos ingredientes<br/>até a primeira mordida.</p><a href="#montar">Monte seu burger <ArrowUpRight size={20}/></a><span className="how-card-signature" aria-hidden="true">feito do seu jeito.</span></header>
      <ol className="how-steps">{steps.map(({ icon: Icon, title, description }, index)=><li className="how-step" key={title}><span className="how-step-icon" aria-hidden="true"><Icon size={26} strokeWidth={1.6}/></span><div className="how-step-copy"><h3>{title}</h3><p>{description}</p></div><span className="how-step-number" aria-hidden="true">0{index+1}</span></li>)}</ol>
    </div>
  </section>;
}
