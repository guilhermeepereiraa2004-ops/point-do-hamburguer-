import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type PushAlertProfile = "standard" | "system-default";
type Receipt = { probe: string; expires: number; profile: PushAlertProfile };
type PushDiagnostics = {
  browser: "chrome" | "edge" | "firefox" | "safari" | "other"; browserMajor: number;
  platform: "android" | "ios" | "desktop" | "other"; notificationRead: boolean;
  notificationCount: number; actualSilent: boolean | null; actualRenotify: boolean | null;
};
export type PushReceiptEvent = {
  probe: string; revision: string; requestedProfile: PushAlertProfile;
  displayedProfile: PushAlertProfile | "fallback"; displayed: boolean; canonicalOrigin: boolean;
  diagnostics?: PushDiagnostics;
};
const lifetime = 20 * 60 * 1000;
const signature = (payload: string, secret: string) => createHmac("sha256", secret).update(`point:push-receipt:v1:${payload}`).digest("base64url");

export function createPushReceipt(secret: string, profile: PushAlertProfile = "standard", now = Date.now()) {
  if (secret.length < 32) throw new Error("Notificações não configuradas.");
  const receipt: Receipt = { probe: randomUUID(), expires: now + lifetime, profile };
  const payload = Buffer.from(JSON.stringify(receipt)).toString("base64url");
  return { probe: receipt.probe, token: `${payload}.${signature(payload, secret)}` };
}

function verifyReceipt(token: unknown, secret: string, now: number): Receipt | null {
  if (secret.length < 32 || typeof token !== "string" || token.length > 512) return null;
  const match = token.match(/^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/);
  if (!match || !timingSafeEqual(Buffer.from(match[2]), Buffer.from(signature(match[1], secret)))) return null;
  try {
    const receipt = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8")) as Receipt;
    if (!/^[0-9a-f-]{36}$/.test(receipt.probe) || !Number.isSafeInteger(receipt.expires) ||
        receipt.expires <= now || receipt.expires > now + lifetime ||
        !["standard", "system-default"].includes(receipt.profile)) return null;
    return receipt;
  } catch { return null; }
}

// Only a recipient of a short-lived encrypted push can submit a display receipt.
// No endpoint, user identifier, order or customer data is included in this log.
export async function pushReceiptResponse(request: Request, secret: string,
  record: (event: PushReceiptEvent) => void, now = Date.now()) {
  const headers = { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" };
  const invalid = () => new Response(null, { status: 404, headers });
  if (Number(request.headers.get("content-length") || 0) > 1024) return invalid();
  try {
    const body = await request.text();
    if (body.length > 1024) return invalid();
    const input = JSON.parse(body);
    const receipt = verifyReceipt(input.token, secret, now);
    if (!receipt || !["point-push-20261108-2", "point-push-20261108-3", "point-push-20261108-4", "point-push-20261108-5"].includes(input.revision) ||
        !["standard", "system-default", "fallback"].includes(input.profile) ||
        typeof input.displayed !== "boolean" || typeof input.canonicalOrigin !== "boolean") return invalid();
    const details = input.diagnostics;
    let diagnostics: PushDiagnostics | undefined;
    if (details !== undefined) {
      if (!details || typeof details !== "object" ||
          !["chrome", "edge", "firefox", "safari", "other"].includes(details.browser) ||
          !Number.isInteger(details.browserMajor) || details.browserMajor < 0 || details.browserMajor > 999 ||
          !["android", "ios", "desktop", "other"].includes(details.platform) ||
          typeof details.notificationRead !== "boolean" ||
          !Number.isInteger(details.notificationCount) || details.notificationCount < 0 || details.notificationCount > 100 ||
          ![true, false, null].includes(details.actualSilent) || ![true, false, null].includes(details.actualRenotify)) return invalid();
      diagnostics = { browser: details.browser, browserMajor: details.browserMajor, platform: details.platform,
        notificationRead: details.notificationRead, notificationCount: details.notificationCount,
        actualSilent: details.actualSilent, actualRenotify: details.actualRenotify };
    }
    record({ probe: receipt.probe, revision: input.revision, requestedProfile: receipt.profile,
      displayedProfile: input.profile, displayed: input.displayed, canonicalOrigin: input.canonicalOrigin,
      ...(diagnostics ? { diagnostics } : {}) });
    return new Response(null, { status: 204, headers });
  } catch { return invalid(); }
}
