# JARVIS secure backend

This Worker is the private server-side bridge between the public Crystal Ball PWA and the OpenAI Responses API. The browser never receives the API key.

## Deploy

1. Install Node.js and Wrangler: `npm install -g wrangler`.
2. From this directory, authenticate: `wrangler login`.
3. Set the provider secret: `wrangler secret put OPENAI_API_KEY`.
4. Review `wrangler.toml`. Set `OPENAI_MODEL` to a model enabled for your API project and `JARVIS_ALLOWED_ORIGIN` to the exact published PWA origin.
5. Deploy: `wrangler deploy`.
6. In Crystal Ball > JARVIS, enter `https://crystal-ball-jarvis.<your-account>.workers.dev/api/jarvis`, then tap **CONNECTER / TESTER**.

The endpoint's OPTIONS response checks CORS reachability; send a message to verify the model credentials and model access.

## Required server settings

- `OPENAI_API_KEY`: secret set with Wrangler, never commit it.
- `OPENAI_MODEL`: model identifier enabled in your API project.
- `JARVIS_ALLOWED_ORIGIN`: exact origin of the PWA, no trailing slash.

## Security and limits

- Exact-origin CORS, POST-only API route, request size and message length limits.
- API key remains in the Worker environment.
- Responses API requests use `store: false`.
- The Worker has no exchange credentials and no order-execution tools.
- The PWA sends a small market snapshot; it is context, not a verified oracle.
- Add Cloudflare rate limiting and usage alerts before exposing the endpoint broadly. API usage may incur charges.
- This is a conversational bridge, not a persistent autonomous agent. Scheduled market monitoring requires a separate durable scheduler/queue and explicit alert destinations.
