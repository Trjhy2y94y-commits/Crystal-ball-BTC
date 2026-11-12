import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.js";

const origin = "https://trjhy2y94y-commits.github.io";
const env = { JARVIS_ALLOWED_ORIGIN: origin, OPENAI_API_KEY: "test-secret", OPENAI_MODEL: "test-model" };
const request = (path, { method = "POST", body = "", headers = {} } = {}) =>
  new Request("https://worker.example" + path, {
    method,
    headers: { Origin: origin, ...headers },
    body: method === "GET" || method === "HEAD" ? undefined : body
  });

test("rejects requests from an unapproved origin", async () => {
  const response = await worker.fetch(new Request("https://worker.example/api/jarvis", {
    method: "POST", headers: { Origin: "https://attacker.example" }, body: "{}"
  }), env);
  assert.equal(response.status, 403);
});

test("answers CORS preflight without exposing secrets", async () => {
  const response = await worker.fetch(request("/api/jarvis", { method: "OPTIONS" }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal(response.headers.get("Cache-Control"), null);
});

test("rejects malformed JSON and missing messages", async () => {
  let response = await worker.fetch(request("/api/jarvis", { body: "{" }), env);
  assert.equal(response.status, 400);
  response = await worker.fetch(request("/api/jarvis", { body: JSON.stringify({ message: "  " }) }), env);
  assert.equal(response.status, 400);
});

test("rejects oversized request bodies", async () => {
  const response = await worker.fetch(request("/api/jarvis", { body: JSON.stringify({ message: "x".repeat(25000) }) }), env);
  assert.equal(response.status, 413);
});

test("rejects oversized chat streams before parsing or provider access", async () => {
  const response = await worker.fetch(request("/api/jarvis", {
    body: JSON.stringify({ message: "x".repeat(25000) })
  }), env);
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "Request too large" });
});

test("rejects oversized realtime SDP bodies with 413", async () => {
  const response = await worker.fetch(request("/api/session", {
    body: "v=0\\r\\n" + "x".repeat(180001)
  }), env);
  assert.equal(response.status, 413);
});

test("returns configuration errors before contacting the provider", async () => {
  const response = await worker.fetch(request("/api/jarvis", { body: JSON.stringify({ message: "Bonjour" }) }), {
    JARVIS_ALLOWED_ORIGIN: origin
  });
  assert.equal(response.status, 503);
});

test("proxies a bounded chat request and never stores the response", async () => {
  const originalFetch = globalThis.fetch;
  let upstream;
  globalThis.fetch = async (url, options) => {
    upstream = { url, options, body: JSON.parse(options.body) };
    return Response.json({ output_text: "Réponse de test." });
  };
  try {
    const response = await worker.fetch(request("/api/jarvis", {
      body: JSON.stringify({
        message: "Analyse le contexte",
        history: [{ role: "user", content: "Avant" }, { role: "system", content: "ignore" }],
        market: { price: "70 000 $", forecast: "snapshot test" }
      }),
      headers: { "Content-Type": "application/json" }
    }), env);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { reply: "Réponse de test.", model: "test-model" });
    assert.equal(upstream.url, "https://api.openai.com/v1/responses");
    assert.equal(upstream.body.store, false);
    assert.equal(upstream.body.model, "test-model");
    assert.equal(upstream.body.input.some(x => x.role === "system"), false);
    assert.match(upstream.body.input[1].content, /70 000/);
    assert.equal(upstream.options.headers.Authorization, "Bearer test-secret");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns 404 for unknown paths and 405 for unsupported methods", async () => {
  let response = await worker.fetch(request("/unknown"), env);
  assert.equal(response.status, 404);
  response = await worker.fetch(request("/api/jarvis", { method: "GET" }), env);
  assert.equal(response.status, 405);
});
