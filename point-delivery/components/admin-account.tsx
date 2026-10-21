"use client";
import { useState } from "react";
import { LogOut, KeyRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
export function AdminAccount() {
  const [busy, setBusy] = useState(false);
  return <div className="admin-account"><a href="/admin/seguranca"><KeyRound size={15}/> Minha conta</a><button disabled={busy} onClick={async()=>{setBusy(true);try{await authClient.signOut();window.location.assign('/sign-in');}finally{setBusy(false);}}}><LogOut size={15}/> Sair</button></div>;
}
