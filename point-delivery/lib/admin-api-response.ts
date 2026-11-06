export class AdminApiError extends Error {
  readonly status: number;
  readonly redirected: boolean;

  constructor(message: string, status: number, redirected: boolean) {
    super(message);
    this.status = status;
    this.redirected = redirected;
  }
}

export async function readAdminResponse(response: Response, fallback: string): Promise<Record<string, unknown>> {
  const redirected = response.redirected || response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400);
  const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  const fail = (message = fallback) => new AdminApiError(message, response.status, redirected);
  if (redirected || type !== "application/json") throw fail();

  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw fail();
  const payload = body as Record<string, unknown>;
  if (!response.ok) {
    throw fail(response.status < 500 && typeof payload.error === "string" && payload.error.trim() ? payload.error : fallback);
  }
  return payload;
}
