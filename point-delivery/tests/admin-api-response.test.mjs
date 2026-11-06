import { test } from "node:test";
import assert from "node:assert/strict";
import { AdminApiError, readAdminResponse } from "../lib/admin-api-response.ts";

const fallback = "Não foi possível atualizar o painel.";

test("HTML error pages and malformed JSON never expose a parser error or page contents", async () => {
  for (const response of [
    new Response("<!DOCTYPE html><title>Private error page</title>", { status: 503, headers: { "content-type": "text/html" } }),
    new Response("<!DOCTYPE html>", { headers: { "content-type": "application/json" } }),
    new Response("null", { headers: { "content-type": "application/json" } }),
  ]) {
    await assert.rejects(readAdminResponse(response, fallback), error => error instanceof AdminApiError && error.message === fallback);
  }
});

test("a login redirect is distinguished from a temporary failure", async () => {
  await assert.rejects(readAdminResponse(Response.redirect("https://example.test/sign-in"), fallback),
    error => error instanceof AdminApiError && error.redirected && error.status === 302);
});

test("structured validation errors are kept and the next valid response can be read", async () => {
  await assert.rejects(readAdminResponse(Response.json({ error: "Estoque insuficiente." }, { status: 400 }), fallback),
    error => error instanceof AdminApiError && error.message === "Estoque insuficiente.");
  await assert.rejects(readAdminResponse(Response.json({ error: "Internal database detail" }, { status: 503 }), fallback),
    error => error instanceof AdminApiError && error.message === fallback);
  assert.deepEqual(await readAdminResponse(Response.json({ ok: true }), fallback), { ok: true });
});
