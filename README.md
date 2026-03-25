# React AI Chat (Gemini proxy + localStorage)

Monorepo: **client** (Vite, React 18, TypeScript, [MUI](https://mui.com/) Material Design 3 + minimal global SCSS) and **server** (Express, [Google Gemini API](https://ai.google.dev/gemini-api/docs) streaming via `@google/generative-ai`). The browser only talks to `POST /api/chat`; the API key stays on the server.

**Data flow in one sentence:** the React app serializes the visible thread to JSON, POSTs it to your Node server, the server attaches the secret key and calls Google’s streaming **generateContent** API, then forwards token deltas over **SSE** back to the client while **localStorage** persists threads entirely on the device (no server-side chat DB in this demo).

## Project structure

The repo root is an npm **workspace** parent: `package.json` wires scripts that run **client** and **server** together and hosts **Playwright** specs under `e2e/`. Workspaces keep dependencies isolated per package while sharing one `node_modules` layout at the root—useful when the UI and API evolve at different speeds. The root is not an app runtime itself; it orchestrates packages the same way a small **monorepo** coordinates multiple deployable units.

```
react-ai-chat/
├── package.json              # workspace scripts: dev, build, test, test:e2e
├── e2e/                      # Playwright: full UI flows with a stubbed API (no real Gemini)
├── client/
│   ├── package.json          # Vite + React + MUI; own build output in dist/
│   ├── vite.config.*         # dev server; proxies /api to the Express port (same-origin feel)
│   └── src/
│       ├── main.tsx          # React mount; wraps the tree in the theme provider (global context)
│       ├── App.tsx           # top-level route shell; currently renders only the chat layout
│       ├── AppThemeProvider.tsx  # MUI CssVarsProvider + mode sync (manual light/dark toggle)
│       ├── theme/appTheme.ts     # createTheme: palettes, typography, component overrides
│       ├── components/       # presentational UI: layout, sidebar, bubbles, composer, token bar
│       ├── hooks/useChatSession.ts  # state machine: threads, send, SSE consumption, errors, token tallies
│       ├── lib/              # side-effect boundaries: fetch, SSE parsing, persistence, API message shaping
│       ├── types/            # shared TS shapes for chat messages and token usage payloads
│       └── styles/global.scss    # small global layer on top of MUI (fonts, baseline tweaks)
└── server/
    ├── package.json
    └── src/
        ├── index.ts          # process entry: load .env, GoogleGenerativeAI + model, listen on PORT
        ├── createApp.ts      # Express factory: middleware stack + POST /api/chat (testable without listen)
        ├── validateChatBody.ts   # request validation: fail fast with 400 before any provider call
        ├── streamGemini.ts   # bridges Gemini streaming SDK → HTTP response as SSE chunks
        └── sse.ts            # SSE helpers: correct Content-Type and framing for browser EventSource-style clients
```

### Theory: how the pieces fit

- **`e2e/`** — Runs the **built or previewed** client in a real browser and asserts DOM behavior. Network is **stubbed** (`page.route`) so tests do not call Gemini and do not need secrets. This is the **outside-in** safety net: it validates wiring (test IDs, forms, streaming UI) that unit tests often miss.

- **`client/vite.config.*`** — Vite is a **dev bundler** with instant HMR. The `/api` proxy makes browser requests same-origin during development, which matches common production setups (one hostname, `/api` routed to Node) and avoids extra CORS configuration while you iterate.

---

#### Client (React / Vite) — files in depth

- **`main.tsx`** — **React 18 `createRoot`** entry: mounts once and attaches the tree to `#root`. Wrapping children in `AppThemeProvider` before `App` means **every** descendant can consume MUI theme context and the document gets consistent baseline styles.

- **`App.tsx`** — Intentionally minimal **shell**: it only renders `ChatLayout`. That keeps “what is the app?” in one place; adding routers, error boundaries, or analytics later does not require touching bootstrap code in `main.tsx`.

- **`AppThemeProvider.tsx`** — Bridges MUI’s **`ThemeProvider`** with **persisted mode**: `defaultMode` / `modeStorageKey` read and write light/dark in `localStorage`, so refreshes remember the user’s choice. `CssBaseline` normalizes cross-browser defaults; `enableColorScheme` aligns native form controls with the active palette.

- **`theme/appTheme.ts`** — Single **design-system object**: `createTheme` defines light/dark **color schemes**, typography, shape, and component overrides (buttons, inputs, paper). Centralizing tokens avoids scattering magic colors in `sx` props and keeps the UI aligned with **Material Design 3** while still allowing customization.

- **`components/ChatLayout.tsx`** — **Page orchestration**: composes sidebar, message area, composer, token footer, error alerts, and wires props from `useChatSession`. It is the boundary between the **stateful hook API** and **presentational children**.

- **`components/Sidebar.tsx`**, **`MessageList.tsx`**, **`Composer.tsx`**, **`TokenStatusBar.tsx`**, **`ThemeToggle.tsx`** — Each owns one **UI region** and preserves stable **`data-testid`s** where E2E depends on them. They stay mostly declarative (MUI + `sx`) so visual tweaks rarely break business logic.

- **`hooks/useChatSession.ts`** — The **feature controller**: owns `threads`, `activeId`, `streaming`, errors, and token aggregates. It calls `streamChat`, appends assistant text as deltas arrive, and **debounces** `saveChatThreads` so storage does not run on every render. **`useRef` mirrors** (`threadsRef`, `activeIdRef`, …) fix a classic React issue: async stream callbacks must read **current** state, not a stale closure from when the request started. **`AbortController`** cancels in-flight streams when switching chats or sending again.

- **`lib/chatApi.ts`** — **Network boundary**: `fetch('/api/chat', …)` with JSON body, maps HTTP errors to `onError`, pipes `res.body` through `parseSseStream`, and invokes callbacks for deltas, terminal `done` (usage + context hint), or stream errors. Isolating transport here makes it easy to mock or replace (e.g. WebSocket later).

- **`lib/sseParse.ts`** — **Protocol adapter**: SSE on the wire is text (`data: …\n\n`); this module turns bytes into typed **`SseClientEvent`** values. Defensive `JSON.parse` and field checks isolate malformed server output—failures become stream errors instead of uncaught exceptions in UI code.

- **`lib/storage.ts`** — **Persistence adapter** over `localStorage` (serialize/deserialize `ChatThread[]`). Swapping in `indexedDB` or a remote API later would not require rewriting the hook.

- **`lib/messagesForApi.ts`** — **Prompt shaping**: removes a trailing empty assistant message before POST so the provider never sees a bogus final assistant turn. Documents the rule that **on-screen streaming state** and **API payload** are not always identical.

- **`lib/threadUtils.ts`** — **Pure domain helpers**: titles from first user text, `makeThread`, `appendAssistantShell` for the empty streaming bubble. Keeps thread-structure rules out of the hook and easy to unit test.

- **`lib/formatTokens.ts`** — **Presentation helper** for large integers (compact `k` suffix) so the token bar does not embed formatting rules.

- **`types/chat.ts`**, **`types/tokenUsage.ts`** — **Shared contracts** between hook, API client, and UI so message roles and “done” payloads stay consistent under refactors.

- **`styles/global.scss`** — **Escape hatch** for globals MUI does not own (e.g. font loading). Prefer theme tokens and `sx` for component styling to avoid specificity fights with MUI’s generated CSS.

- **`lib/*.test.ts` (Vitest)** — **Colocated unit tests** for parsers and storage helpers; they run fast in Node/jsdom without rendering the full React tree.

---

#### Server (Node / Express) — files in depth

- **`server/src/index.ts`** — **Process entry**: loads `dotenv`, reads `PORT`, `GEMINI_API_KEY`, `GEMINI_MODEL`, optional `GEMINI_CONTEXT_WINDOW`. Builds **`StreamDeps`** (`GenerativeModel` + config) or `null` if the key is missing, passes them into `createApp`, then **`http.createServer(app).listen`**. Only this file should couple to **environment and listening**; the rest stays testable without an open port.

- **`server/src/createApp.ts`** — **Express app factory**: registers CORS (dev origins by default), `express.json` with a body size limit, and **`POST /api/chat`**. Validates the body, returns **503** if streaming dependencies are not configured, otherwise calls `streamChatToSse`. Exporting `createApp` (instead of listening inside) lets **`createApp.test.ts`** hit the route with **supertest** and injected mocks.

- **`server/src/validateChatBody.ts`** — **Trust boundary**: treats `req.body` as untrusted until validated. Narrows `unknown` → **`ChatMessageInput[]`** with hard caps (message count, content length, allowed roles). **`ValidationError`** maps cleanly to HTTP **400** JSON instead of leaking internal stack traces.

- **`server/src/streamGemini.ts`** — **Provider integration**: normalizes chat turns for Gemini (`assistant` → `model`, merges consecutive same-role messages, strips a leading assistant-only prefix), calls **`generateContentStream`**, forwards incremental **`text()`** chunks as SSE **`text_delta`** events, then reads **`usageMetadata`** from the aggregated response for **`done`** (`input_tokens` / `output_tokens` mapped from prompt/candidates counts, optional `context_window` from env). Errors become SSE **`error`**; **`finally { res.end() }`** closes the HTTP response.

- **`server/src/sse.ts`** — **Streaming HTTP hygiene**: sets **`Content-Type: text/event-stream`**, disables caching and proxy buffering where possible (`X-Accel-Buffering`), flushes headers early, and writes **`data: …\n\n`** frames. Separating **framing** from **domain** logic keeps `streamGemini` readable.

- **`server/src/createApp.test.ts`** — **HTTP integration tests** via supertest against the Express app returned by `createApp`, with **injected `streamDeps`** (mock `GenerativeModel`) so no real Gemini calls or listening server is required.

## Requirements

- Node.js 18+
- A [Google AI Studio API key](https://aistudio.google.com/apikey) for real conversations (Gemini Developer API)

## Setup

```bash
npm install
```

Copy server env template and set your key:

```bash
copy .env.example server\.env
```

Edit `server/.env` and set `GEMINI_API_KEY` (see `.env.example`). Set **`GEMINI_MODEL`** if you do not want the default (`gemini-2.0-flash`).

Optional: set **`GEMINI_CONTEXT_WINDOW`** (e.g. `1000000` for large Gemini context models). The UI footer then shows a rough **“context left”** estimate from the last reply’s reported input tokens. Google does not expose account-wide “remaining” quota in the stream; session totals are kept in memory in the browser until reload.

## Development

Runs Express (default `http://localhost:3001`) and Vite with `/api` proxied to the server:

```bash
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

## Production build

```bash
npm run build
```

This builds the client to `client/dist` and the server to `server/dist`. For a real deployment you would serve the built SPA and run the Node server (or put the API behind your host’s routing). This demo is not production-hardened (no auth, no rate limiting).

## Tests

**Unit / integration (Vitest)** — no Gemini key required:

```bash
npm test
```

**E2E (Playwright)** — uses a mocked `POST /api/chat` response; no key required. The config starts a **Vite preview** server on `http://127.0.0.1:4173`.

```bash
npx playwright install
npm run test:e2e
```

Optional UI mode: `npm run test:e2e:ui`.

To reuse an already-running preview and skip the pre-test build (faster local runs): set `PLAYWRIGHT_REUSE_SERVER=1` before `npm run test:e2e`.

## Limitations (demo)

- API key must never be committed; use `server/.env` locally.
- CORS is restricted to the dev Vite origin; adjust for your deployed origins.
- Chat history is stored in **localStorage** in this browser only; clearing site data loses threads.
