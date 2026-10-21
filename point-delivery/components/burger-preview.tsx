import { Check, Layers3, Play, Pause } from "lucide-react";
import "../app/burger-preview.css";
import type { CSSProperties } from "react";
import type { Selection } from "@/domain/menu";
import photos from "./ingredient-photos.json";
import { composeBurger, type Photo } from "./burger-composition";

const assets: Record<string, Photo> = photos;
const source = (id: string) => `/ingredients/${assets[id].file || `${id}.png`}`;

export function IngredientPhoto({ id, className = "" }: { id: string; className?: string }) {
  const photo = assets[id];
  if (!photo) return null;
  const { crop } = photo;
  return <svg className={`ingredient-photo ${className}`} viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} aria-hidden="true" focusable="false"><image href={source(id)} width={photo.width} height={photo.height} /></svg>;
}

export function BurgerPreview({ selection, closed = false, closing = false, onViewChange, forceMotion = false, onMotionChange }: { selection: Selection; closed?: boolean; closing?: boolean; onViewChange?: (closed: boolean) => void; forceMotion?: boolean; onMotionChange?: () => void }) {
  const { layers, count, openLift, openShift, closedShift, viewBox, baseBottom } = composeBurger(selection, assets);
  const massStyle = { transform: `translateY(${closed ? closedShift : openShift}px)` } as CSSProperties;
  return <div className={`burger-experience ${closed ? "is-closed" : "is-open"} ${closing ? "is-closing" : ""} ${forceMotion ? "allow-motion" : ""}`} data-state={closing ? "closing" : closed ? "closed" : "open"}>
    {onViewChange && <div className="assembly-view-controls" role="group" aria-label="Visualização do hambúrguer">
      <button type="button" aria-pressed={!closed} onClick={() => onViewChange(false)} disabled={closing}><Layers3 size={13} /> Aberto</button>
      <button type="button" aria-pressed={closed} onClick={() => onViewChange(true)} disabled={closing}><Check size={13} /> Fechado</button>
    </div>}
    {onMotionChange && <button type="button" className="assembly-motion-choice" aria-pressed={forceMotion} onClick={onMotionChange} disabled={closing}>{forceMotion ? <Pause size={10}/> : <Play size={10}/>} {forceMotion ? "Animação ativada" : "Ativar animação"}</button>}
    <div className="photo-scene">
      <div className="assembly-ambient" aria-hidden="true" />
      {layers.length ? <svg className="photo-burger" viewBox={viewBox} role="img" aria-label={`Hambúrguer ${closed ? "fechado" : "aberto para montagem"} com ${count} itens selecionados`}>
        <title>{closed ? "Seu hambúrguer finalizado" : "Pão aberto para escolher seus recheios"}</title>
        
        <g className="burger-mass" style={massStyle}>
          <ellipse className="assembly-ground" cx="200" cy={baseBottom + 8} rx="122" ry="8" />
          {layers.map(layer => {
            const photo = assets[layer.photoId];
            const lid = layer.role === "lid";
            const offset = closed ? layer.closedOffset : { x: 0, y: 0, rotation: 0 };
            const lift = lid && !closed ? `translate(17px, -${openLift}px) rotate(-7deg)` : `translate(${offset.x}px, ${offset.y}px) rotate(${layer.rotation + offset.rotation}deg)`;
            return <g key={layer.key} className={lid ? "burger-lid" : "burger-food"} data-ingredient={layer.id} data-photo={layer.photoId} data-quantity={layer.quantity} style={{ transform: lift, transformOrigin: lid ? "200px 300px" : `${layer.x + layer.width / 2}px ${layer.y + layer.height / 2}px` }}>
              <svg className="food-silhouette" x={layer.x} y={layer.y} width={layer.width} height={layer.height} viewBox={`${layer.crop.x} ${layer.crop.y} ${layer.crop.width} ${layer.crop.height}`} overflow="visible">
                <image key={layer.photoId} href={source(layer.photoId)} width={photo.width} height={photo.height} />
              </svg>
            </g>;
          })}
        </g>
      </svg> : <p className="photo-empty">Escolha o pão e seus ingredientes para começar.</p>}
      <span className="assembly-caption" aria-live="polite">{closing ? "Dando o último toque…" : closed ? "Pronto para a primeira mordida." : "Na ordem da casa, do seu jeito."}</span>
    </div>
  </div>;
}
