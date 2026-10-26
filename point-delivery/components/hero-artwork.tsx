import { DecorativeSpark } from "@/components/decorative-spark";
import imageAssets from "./menu-image-assets.json";

export function HeroArtwork({ price }: { price: string }) {
  return (
    <div className="hero-art">
      <div className="hero-halo" aria-hidden="true" />
      <div className="orbit-line" aria-hidden="true" />
      <div className="hero-burger-shadow" aria-hidden="true" />
      <span className="hero-handwritten">aqui quem monta<br />é você! <svg viewBox="0 0 100 60" aria-hidden="true"><path d="M4 4Q90-6 77 49m-12-9 12 12 12-10" /></svg></span>
      <img className="hero-burger" src={imageAssets.hero.src} srcSet={imageAssets.hero.srcSet} sizes="(max-width: 760px) 92vw, (max-width: 1200px) 50vw, 600px" width={imageAssets.hero.width} height={imageAssets.hero.height} alt="Hambúrguer com pão de gergelim, carne, queijo, bacon e salada" fetchPriority="high" decoding="async" />
      <div className="price-sticker"><span>A PARTIR DE</span><strong>{price}</strong></div>
      <span className="little-spark spark-one" aria-hidden="true"><DecorativeSpark/></span>
      <span className="little-spark spark-two" aria-hidden="true"><DecorativeSpark diamond/></span>
    </div>
  );
}

const ribbonWords = ["FEITO NA HORA", "DO SEU JEITO", "CAPRICHE NAS CAMADAS", "POINT DO HAMBÚRGUER"];

export function HeroDivider() {
  return (
    <div className="hero-divider" aria-hidden="true">
      <div className="hero-divider-ribbon">
        <div className="hero-divider-track">
          {[...ribbonWords, ...ribbonWords].map((word, index) => (
            <span className="hero-divider-item" key={index}>
              <span className={index % 2 ? "hero-divider-word outline" : "hero-divider-word"}>{word}</span>
              <span className="hero-divider-spark"><DecorativeSpark/></span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
