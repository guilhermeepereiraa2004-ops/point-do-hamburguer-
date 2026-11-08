self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch {}
  const code = typeof data.code === "string" && /^[A-Z0-9]{1,12}$/.test(data.code) ? data.code : null;
  const title = data.test ? "Notificações do Point ativadas" : "Novo pedido no Point";
  const basic = {
    body: data.test ? "Este aparelho está pronto para receber os avisos de pedidos." :
      code ? `Pedido #${code} recebido. Abra o painel para preparar.` : "Chegou um novo pedido. Abra o painel para conferir.",
    icon: "/icons/point-192.png",
    badge: "/icons/point-192.png",
    tag: typeof data.tag === "string" ? data.tag : "point-new-order",
  };
  event.waitUntil((async () => {
    let profile = "standard";
    let displayed = false;
    try {
      await self.registration.showNotification(title, { ...basic,
        renotify: true,
        requireInteraction: true,
        silent: false,
      });
      displayed = true;
    } catch {
      // A rejected optional alert setting must not leave Chrome to show its silent fallback.
      profile = "fallback";
      try { await self.registration.showNotification(title, basic); displayed = true; } catch {}
    }
    if (typeof data.receipt === "string") {
      try {
        await fetch("https://point-do-hamburguer.vercel.app/api/push-receipt", {
          method: "POST", credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store",
          headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(5000),
          body: JSON.stringify({ token: data.receipt, revision: "point-push-20261108-3", profile, displayed,
            canonicalOrigin: self.location.origin === "https://point-do-hamburguer.vercel.app" }),
        });
      } catch {}
    }
  })());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL("/admin?section=pedidos", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const panel = windows.find(client => {
      const url = new URL(client.url);
      return url.origin === self.location.origin && url.pathname.startsWith("/admin");
    });
    if (panel) {
      const navigated = await panel.navigate(target);
      if (navigated) return navigated.focus();
    }
    return self.clients.openWindow(target);
  })());
});
