"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, ClipboardList, Ellipsis, Hamburger, LayoutDashboard, Package, Settings2, TrendingUp, Users, X } from "lucide-react";
import { AdminAccount } from "@/components/admin-account";
import "./admin-navigation.css";

const sections = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  pedidos: { label: "Pedidos", icon: ClipboardList },
  cardapio: { label: "Cardápio", icon: BookOpen },
  estoque: { label: "Estoque", icon: Package },
  financeiro: { label: "Financeiro", icon: TrendingUp },
  clientes: { label: "Clientes", icon: Users },
  precos: { label: "Preços", icon: Settings2 },
};
export type AdminSection = keyof typeof sections;
export const adminSectionLabel = (section: AdminSection) => sections[section].label;
const groups = [
  { label: "Visão geral", sections: ["dashboard"] },
  { label: "Operação", sections: ["pedidos", "cardapio", "estoque"] },
  { label: "Gestão", sections: ["financeiro", "clientes", "precos"] },
] as const;
const shortcuts = ["dashboard", "pedidos", "estoque", "financeiro"] as const;
const pendingLabel = (count: number) => `${count} ${count === 1 ? "pedido" : "pedidos"} em andamento`;

type NavigationProps = {
  current: AdminSection;
  pending: number;
  onNavigate: (section: AdminSection) => void;
};

function SectionButtons({ current, pending, onNavigate }: NavigationProps) {
  return groups.map(group => <div className="workspace-nav-group" key={group.label}>
    <span className="workspace-nav-label">{group.label}</span>
    {group.sections.map(id => {
      const { label, icon: Icon } = sections[id];
      return <button type="button" key={id} aria-current={current === id ? "page" : undefined} onClick={() => onNavigate(id)}>
        <Icon size={19} aria-hidden="true"/><span>{label}</span>
        {id === "pedidos" && pending > 0 && <b aria-label={pendingLabel(pending)}>{pending > 99 ? "99+" : pending}</b>}
      </button>;
    })}
  </div>);
}

function WorkspaceLinks() {
  return <div className="workspace-links">
    <a className="workspace-store-link" href="/"><BookOpen size={17} aria-hidden="true"/> Ver cardápio da loja <ArrowUpRight size={15} aria-hidden="true"/></a>
    <AdminAccount/>
  </div>;
}

export function AdminNavigation({ current, pending, onNavigate, connected }: NavigationProps & { connected: boolean }) {
  const [open, setOpen] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    function closeOnDesktop() { if (desktop.matches && sheet.current?.open) sheet.current.close(); }
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  function openSheet() {
    if (!sheet.current || sheet.current.open) return;
    sheet.current.showModal();
    setOpen(true);
    closeButton.current?.focus();
  }
  function navigate(section: AdminSection) {
    if (sheet.current?.open) sheet.current.close();
    onNavigate(section);
  }
  return <>
    <aside className="workspace-sidebar">
      <a className="workspace-brand" href="/" aria-label="Point do Hambúrguer, início da loja">
        <span className="workspace-brand-icon"><Hamburger size={25} aria-hidden="true"/></span>
        <span><strong>Point do Hambúrguer</strong><small>Painel administrativo</small></span>
      </a>
      <nav className="workspace-navigation" aria-label="Navegação administrativa">
        <SectionButtons current={current} pending={pending} onNavigate={navigate}/>
      </nav>
      <footer className="workspace-sidebar-footer">
        <WorkspaceLinks/>
        <div className={`workspace-connection${connected ? " is-online" : ""}`}><i aria-hidden="true"/>{connected ? "Painel conectado" : "Reconectando…"}</div>
      </footer>
    </aside>

    <nav className="workspace-shortcuts" aria-label="Atalhos administrativos">
      {shortcuts.map(id => {
        const { label, icon: Icon } = sections[id];
        return <button type="button" key={id} aria-current={current === id ? "page" : undefined} onClick={() => navigate(id)}>
          <span className="workspace-shortcut-icon"><Icon size={21} aria-hidden="true"/>
            {id === "pedidos" && pending > 0 && <b aria-label={pendingLabel(pending)}>{pending > 99 ? "99+" : pending}</b>}
          </span>
          {id === "dashboard" ? "Início" : label}
        </button>;
      })}
      <button type="button" className={shortcuts.some(id => id === current) ? undefined : "has-current-section"} aria-haspopup="dialog" aria-expanded={open} aria-controls="workspace-mobile-menu" onClick={openSheet}>
        <span className="workspace-shortcut-icon"><Ellipsis size={23} aria-hidden="true"/></span>Mais
      </button>
    </nav>

    <dialog ref={sheet} id="workspace-mobile-menu" className="workspace-sheet" aria-labelledby="workspace-menu-title" onClose={() => setOpen(false)} onClick={event => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    }}>
      <div className="workspace-sheet-content">
        <header className="workspace-sheet-header">
          <div><h2 id="workspace-menu-title">Menu do painel</h2><p>Escolha para onde ir.</p></div>
          <button type="button" ref={closeButton} aria-label="Fechar menu" onClick={() => sheet.current?.close()}><X size={21} aria-hidden="true"/></button>
        </header>
        <nav className="workspace-navigation" aria-label="Todas as áreas administrativas">
          <SectionButtons current={current} pending={pending} onNavigate={navigate}/>
        </nav>
        <WorkspaceLinks/>
      </div>
    </dialog>
  </>;
}
