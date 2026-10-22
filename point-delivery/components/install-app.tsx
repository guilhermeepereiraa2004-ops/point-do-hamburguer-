"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, Check, Hamburger, Share, Smartphone, X } from "lucide-react";
import "@/app/install-app.css";
import { DecorativeSpark } from "@/components/decorative-spark";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp() {
  const promptRef = useRef<InstallPrompt | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const update = () => setInstalled(standalone.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    update();
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const onPrompt = (event: Event) => { event.preventDefault(); promptRef.current = event as InstallPrompt; };
    const onInstalled = () => { promptRef.current = null; setInstalled(true); dialogRef.current?.close(); };
    standalone.addEventListener("change", update);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      standalone.removeEventListener("change", update);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    const prompt = promptRef.current;
    if (!prompt) { dialogRef.current?.showModal(); return; }
    promptRef.current = null;
    setBusy(true);
    setMessage("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === "accepted" ? "Conclua a instalação na janela do navegador." : "Tudo bem! Você pode adicionar o Point quando quiser.");
    } catch {
      setMessage("Veja como adicionar o Point pelo menu do navegador.");
      dialogRef.current?.showModal();
    } finally { setBusy(false); }
  }

  if (installed) return null;

  return <section className="install-section container" aria-labelledby="install-heading">
    <div className="install-card">
      <div className="install-art" aria-hidden="true"><div className="install-phone"><span className="install-camera"/><span className="install-app-icon"><Hamburger size={38}/></span><strong>point</strong><span>DO HAMBÚRGUER</span><div className="install-phone-pill"><Check size={13}/> Sempre por perto</div></div><span className="install-spark"><DecorativeSpark/></span></div>
      <div className="install-copy"><div className="eyebrow"><Smartphone size={15}/> SEU POINT NO CELULAR</div><h2 id="install-heading">Bateu a fome?<br/>Seu Point está a um toque.</h2><p>Adicione o Point à tela inicial e vá direto ao cardápio, sem precisar procurar o link. Seu próximo burger começa aqui.</p><button type="button" className="button primary install-button" disabled={busy} onClick={()=>void install()}><ArrowDownToLine size={19}/>{busy ? "Abrindo instalação…" : ios ? "Adicionar à tela inicial" : "Instalar o Point"}<ArrowRight size={18}/></button><small>Grátis. Sem loja de aplicativos. Direto na sua tela inicial.</small><p className="install-feedback" role="status">{message}</p></div>
    </div>
    <dialog ref={dialogRef} className="install-dialog" aria-labelledby="install-dialog-title" onClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.currentTarget.close();}}}>
      <button type="button" className="install-close" aria-label="Fechar instruções" onClick={()=>dialogRef.current?.close()}><X size={22}/></button>
      <span className="install-dialog-icon"><Smartphone size={27}/></span><h2 id="install-dialog-title">Seu Point na tela inicial</h2><p>É rapidinho. Depois, é só tocar no ícone para abrir o cardápio.</p>
      {ios ? <><h3>No iPhone ou iPad</h3><ol><li>Abra este site no <strong>Safari</strong>.</li><li>Toque em <strong>Compartilhar <Share size={15}/></strong> no menu do navegador.</li><li>Escolha <strong>Adicionar à Tela de Início</strong>. Se aparecer, mantenha <strong>Abrir como App da Web</strong> ativado.</li><li>Confirme em <strong>Adicionar</strong>.</li></ol></> : <><h3>No Android</h3><ol><li>Abra este site no <strong>Chrome</strong>.</li><li>Toque no menu <strong>⋮</strong> do navegador.</li><li>Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong> e confirme.</li></ol><p>Se a opção não aparecer, tente fora do navegador do Instagram ou WhatsApp, usando o Chrome.</p><h3>Usa iPhone?</h3><p>No Safari, toque em <strong>Compartilhar → Adicionar à Tela de Início → Adicionar</strong>.</p></>}
      <p className="install-online-note">Você precisa de internet para consultar o cardápio e fazer pedidos.</p><button type="button" className="button primary" onClick={()=>dialogRef.current?.close()}>Entendi <Check size={17}/></button>
    </dialog>
  </section>;
}
