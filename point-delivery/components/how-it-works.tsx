import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { IngredientPhoto } from "./burger-preview";
import imageAssets from "./menu-image-assets.json";
import beveragePhotos from "./beverage-photos.json";
import "@/app/how-it-works.css";

const steps = [
  { title: "Comece sua montagem", description: "Escolha quantos hambúrgueres vão ser. Cada lanche pode ter sua própria combinação." },
  { title: "Escolha os ingredientes", description: "Carne, queijo, salada… Você decide o que entra e a quantidade de cada item." },
  { title: "Complete e peça", description: "Se quiser, adicione batatas e bebidas. Depois, é só informar a entrega." },
];

export function HowItWorks({ onMenu }: { onMenu?: () => void }) {
  return <section id="como-funciona" className="how-card-section container" aria-labelledby="how-heading">
    <header className="how-header">
      <div><span className="how-label">DA SUA ESCOLHA À PRIMEIRA MORDIDA</span><h2 id="how-heading">Você imagina.<br/><span>A gente capricha.</span></h2></div>
      <a className="how-menu-link" href="#montar" onClick={onMenu}>Começar meu pedido<span><ArrowUpRight size={23} aria-hidden="true"/></span></a>
    </header>
    <ol className="how-steps">
      {steps.map(({ title, description }, index) => <li className={`how-step how-step-${index + 1}`} key={title}>
        <div className="how-step-visual" aria-hidden="true">
          <span className="how-step-number">0{index + 1}</span>
          {index === 0 ? <img className="how-burger" src={imageAssets.hero.src} srcSet={imageAssets.hero.srcSet} sizes="(max-width: 760px) 180px, 250px" width={imageAssets.hero.width} height={imageAssets.hero.height} alt="" loading="lazy" decoding="async"/> : index === 1 ? <div className="how-ingredients">
            <IngredientPhoto id="salada" className="how-layer how-lettuce"/>
            <IngredientPhoto id="queijo" className="how-layer how-cheese"/>
            <IngredientPhoto id="carne-hamburguer" className="how-layer how-patty"/>
            <span className="how-add"><Plus size={21}/></span>
          </div> : <div className="how-extras">
            <img className="how-fries" src="/images/accompaniments/baskets-v2/batata-frita-tradicional.webp" width={240} height={240} alt="" loading="lazy" decoding="async"/>
            <img className="how-coke" src={beveragePhotos.refrigerante} width={120} height={180} alt="" loading="lazy" decoding="async"/>
          </div>}
          {index < 2 && <span className="how-step-next"><ArrowRight size={19}/></span>}
        </div>
        <div className="how-step-copy"><h3>{title}</h3><p>{description}</p></div>
      </li>)}
    </ol>
  </section>;
}
