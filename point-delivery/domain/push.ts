export type PushTarget = { endpoint: string; keys: { p256dh: string; auth: string } };

export function validatePushTarget(input: unknown): PushTarget {
  if (!input || typeof input !== "object") throw new Error("Inscrição de notificações inválida.");
  const { endpoint, keys } = input as Partial<PushTarget>;
  if (typeof endpoint !== "string" || endpoint.length > 4096 || !keys ||
      typeof keys.p256dh !== "string" || typeof keys.auth !== "string" ||
      !/^[A-Za-z0-9_-]{87}$/.test(keys.p256dh) || !/^[A-Za-z0-9_-]{22}$/.test(keys.auth)) {
    throw new Error("Inscrição de notificações inválida.");
  }
  const url = new URL(endpoint);
  const allowed = ["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"].includes(url.hostname) ||
    url.hostname.endsWith(".notify.windows.com");
  if (url.protocol !== "https:" || url.username || url.password || url.hash || url.port || !allowed) {
    throw new Error("Serviço de notificações não reconhecido.");
  }
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}
