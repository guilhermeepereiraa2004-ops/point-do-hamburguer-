"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { repeatBurgerRecipe } from "@/domain/assembly-flow";
import { countItems, type Catalog, type Selection } from "@/domain/menu";

type Props = {
  burgers: Selection[];
  source: number;
  finished: boolean[];
  catalog: Catalog;
  disabled: boolean;
  validRecipe: boolean;
  onApply: (targets: number[]) => boolean;
};

export function RepeatBurger({ burgers, source, finished, catalog, disabled, validRecipe, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState<number[]>([]);
  const [confirmation, setConfirmation] = useState("");
  const [actionError, setActionError] = useState("");
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const options = burgers.map((burger, index) => ({ burger, index })).filter(option => option.index !== source);
  let issue = "";
  if (open && targets.length) {
    try { repeatBurgerRecipe(burgers, source, targets, catalog); }
    catch (error) { issue = error instanceof Error ? error.message : "Não foi possível repetir esta receita."; }
  }
  function showOptions() {
    const pending = options.filter(option => !finished[option.index]);
    setTargets((pending.length ? pending : options).map(option => option.index));
    setConfirmation("");setActionError("");setOpen(true);
  }
  function apply() {
    try {
      if (!onApply(targets)) return;
      setConfirmation(`Receita copiada para ${targets.map(index => `o hambúrguer ${index + 1}`).join(" e ")}. Revise e finalize cada lanche.`);
      setOpen(false);setActionError("");
      window.requestAnimationFrame(()=>openButtonRef.current?.focus({preventScroll:true}));
    } catch (error) { setActionError(error instanceof Error ? error.message : "Não foi possível repetir esta receita."); }
  }
  return (
    <section className="repeat-burger" aria-label="Repetir receita">
      <div className="repeat-burger-heading">
        <div><strong><Copy size={16} aria-hidden="true" />Repetir este lanche</strong><p>{validRecipe ? "Use esta combinação em outros hambúrgueres do pedido." : "Monte este lanche para poder repetir a receita."}</p></div>
        <button ref={openButtonRef} type="button" className="repeat-open" disabled={disabled || !open && !validRecipe} aria-expanded={open} aria-controls="repeat-burger-options" onClick={()=>open?setOpen(false):showOptions}>{open?"Cancelar":"Repetir"}<Copy size={15} aria-hidden="true" /></button>
      </div>
      {open && <div id="repeat-burger-options" className="repeat-burger-options">
        <fieldset disabled={disabled}><legend>Quais hambúrgueres devem ficar iguais ao {source + 1}?</legend>
          <div className="repeat-targets">{options.map(({ burger, index }) => <label key={index}>
            <input type="checkbox" checked={targets.includes(index)} onChange={()=>{setTargets(current=>current.includes(index)?current.filter(target=>target!==index):[...current,index]);setActionError("");}} />
            <span><strong>Hambúrguer {index + 1}</strong><small>{countItems(burger,catalog)>0?"Substituir a receita atual":"Montagem ainda vazia"}</small></span>
          </label>)}</div>
        </fieldset>
        <p className="repeat-hint">Apenas os lanches marcados serão alterados. Depois, você pode ajustar cada um.</p>
        {(issue || actionError) && <p className="notice error" role="alert">{issue || actionError}</p>}
        <button type="button" className="button primary repeat-apply" disabled={disabled || !validRecipe || !targets.length || Boolean(issue)} onClick={apply}>Aplicar em {targets.length} {targets.length===1?"hambúrguer":"hambúrgueres"}<Check size={16}/></button>
      </div>}
      {confirmation && <p className="repeat-confirmation" role="status"><Check size={16} aria-hidden="true" />{confirmation}</p>}
    </section>
  );
}
