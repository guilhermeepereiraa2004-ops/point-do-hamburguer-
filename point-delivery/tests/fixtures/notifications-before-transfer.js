self.addEventListener("push", event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch {}
  const code = typeof data.code === "string" && /^[A-Z0-9]{1,12}$/.test(data.code) ? data.code : null;
  event.waitUntil(self.registration.showNotification(data.test ? "Notificações do Point ativadas" : "Novo pedido no Point", {
    body: data.test ? "Este aparelho está pronto para receber os avisos de pedidos." :
      code ? `Pedido #${code} recebido. Abra o painel para preparar.` : "Chegou um novo pedido. Abra o painel para conferir.",
    icon: "/icons/point-192.png",
    badge: "/icons/point-192.png",
    tag: typeof data.tag === "string" ? data.tag : "point-new-order",
    renotify: true,
    requireInteraction: true,
    silent: false,
  }));
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
