# JARVIS secure backend

This Worker is the private server-side bridge between the public Crystal Ball PWA and the OpenAI Responses API. The browser never receives the API key.

## Deploy

1. Install Node.js and Wrangler: `npm install -g wrangler`.
2. From this directory, authenticate: `wrangler login`.
3. Set the provider secret: `wrangler secret put OPENAI_API_KEY`.
4. Review `wrangler.toml`. Set `OPENAI_MODEL` to a model enabled for your API project and `JARVIS_ALLOWED_ORIGIN` to the exact published PWA origin.
5. Deploy: `wrangler deploy`.
6. In Crystal Ball > JARVIS, enter `https://crystal-ball-jarvis.<your-account>.workers.dev/api/jarvis`, then tap **CONNECTER / TESTER**.

The endpoint's OPTIONS response checks CORS reachability; send a message to verify the model credentials and model access. The same Worker also exposes `/api/session` for low-latency speech-to-speech WebRTC using `OPENAI_REALTIME_MODEL` (default `gpt-realtime-2.1`). The session enables French live input transcription (`gpt-live-transcribe`) so JARVIS can show the user's recognized utterances in the conversation log. In the PWA, enter the Worker `/api/jarvis` URL and tap **CONNECTER / TESTER**, then tap **PARLER** to start a realtime voice session. The microphone permission is requested only after that tap.

## Required server settings

- `OPENAI_API_KEY`: secret set with Wrangler, never commit it.
- `OPENAI_MODEL`: Responses API model identifier enabled in your API project (default `gpt-6-astra`).
- `OPENAI_REALTIME_MODEL`: Realtime-capable model enabled in your API project (default `gpt-realtime-2.1`).
- `JARVIS_ALLOWED_ORIGIN`: exact origin of the PWA, no trailing slash.

## Security and limits

- Exact-origin CORS, POST-only API route, request size and message length limits.
- API key remains in the Worker environment.
- Responses API requests use `store: false`.
- The Worker has no exchange credentials and no order-execution tools.
- The PWA sends a small market snapshot; it is context, not a verified oracle.
- Cloudflare Rate Limiting bindings are configured in `wrangler.toml`: 30 chat calls/minute and 8 realtime session creations/minute per client IP. The Worker fails closed with HTTP 503 if a limiter binding is missing or unavailable, and returns HTTP 429 when a limit is reached.
- The two `namespace_id` values in `wrangler.toml` must be unique within your Cloudflare account. Change them if either is already in use. Wrangler 4.36.0 or later is required.
- Cloudflare rate limits are approximate and counters are local to each Cloudflare location; short bursts can exceed the threshold. IP-based limits can also group users behind the same mobile carrier/NAT. Treat them as an abuse-cost safeguard, not a strict global quota.
- Configure usage alerts and spending limits as well: API usage may incur charges.
- The `/api/session` route uses WebRTC and keeps the standard API key on the Worker. Voice API usage is billed separately.
- This is a conversational bridge, not a persistent autonomous agent. Scheduled market monitoring requires a separate durable scheduler/queue and explicit alert destinations.
