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
    if (code && !data.test) {
      try {
        const panels = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const panel of panels) {
          const url = new URL(panel.url);
          if (url.origin === self.location.origin && (url.pathname === "/admin" || url.pathname.startsWith("/admin/"))) {
            panel.postMessage({ type: "POINT_NEW_ORDER" });
          }
        }
      } catch {}
    }
    if (typeof data.receipt === "string") {
      // Inspect the browser's resulting Notification object, not only the options
      // we requested. These fields do not prove that a physical sound played.
      const diagnostics = { browser: "other", browserMajor: 0, platform: "other",
        notificationRead: false, notificationCount: 0, actualSilent: null, actualRenotify: null };
      try {
        const agent = navigator.userAgent || "";
        const browser = agent.match(/(EdgA?|Chrome|CriOS|Firefox|FxiOS|Version)\/(\d+)/);
        if (browser) {
          diagnostics.browser = /Edg/.test(browser[1]) ? "edge" : /Chrome|CriOS/.test(browser[1]) ? "chrome" : /Firefox|FxiOS/.test(browser[1]) ? "firefox" : "safari";
          diagnostics.browserMajor = Math.min(Number(browser[2]), 999);
        }
        diagnostics.platform = /Android/.test(agent) ? "android" : /iPhone|iPad|iPod/.test(agent) ? "ios" : /Windows|Macintosh|Linux/.test(agent) ? "desktop" : "other";
      } catch {}
      try {
        const notices = await self.registration.getNotifications();
        diagnostics.notificationRead = true;
        diagnostics.notificationCount = Math.min(notices.length, 100);
        const notice = notices.find(item => item.tag === basic.tag);
        if (notice) {
          diagnostics.actualSilent = typeof notice.silent === "boolean" ? notice.silent : null;
          diagnostics.actualRenotify = typeof notice.renotify === "boolean" ? notice.renotify : null;
        }
      } catch {}
      try {
        await fetch("https://point-do-hamburguer.vercel.app/api/push-receipt", {
          method: "POST", credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store",
          headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(5000),
          body: JSON.stringify({ token: data.receipt, revision: "point-push-20261108-6", profile, displayed, diagnostics,
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
