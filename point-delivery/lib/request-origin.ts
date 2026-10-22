type OriginOptions = { allowMissing?: boolean; development?: boolean };

export function hasValidRequestOrigin(request: Request, { allowMissing = true, development = process.env.NODE_ENV === "development" }: OriginOptions = {}) {
  const origin = request.headers.get("origin");
  if (!origin) return allowMissing;
  try {
    const incoming = new URL(origin), expected = new URL(request.url);
    if (incoming.origin !== origin) return false;
    if (origin === expected.origin) return true;
    const loopback = (hostname: string) => hostname === "localhost" || hostname === "127.0.0.1";
    return development && incoming.protocol === "http:" && expected.protocol === "http:" && incoming.port === expected.port && loopback(incoming.hostname) && loopback(expected.hostname);
  } catch { return false; }
}
