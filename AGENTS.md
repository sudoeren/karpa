# AGENTS.md

Repo-specific notes for OpenCode sessions working in `karpa`.

## What this project is
A privacy-first, browser-based AI translator. The Next.js app runs in the user's
browser; the `/api/translate` route talks to a local LLM server (LM Studio by
default; Ollama / OpenAI / Anthropic / Gemini / custom are also supported). The
headline invariant is that **nothing leaves the user's machine** unless they
configure a non-local provider — any change that breaks that promise is
almost certainly out of scope. See `CONTRIBUTING.md` § Privacy guidelines for
the full list of prohibitions (no analytics, no remote fonts/CDNs, no
phone-home).

## Stack & layout
- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui
  (new-york style, neutral base, lucide icons). Aliases: `@/*` → `./src/*`
  (see `tsconfig.json` and `components.json`).
- `src/app/` — routes (`page.tsx`, `history/`, `favorites/`, `settings/`,
  `about/`) and the three API routes under `src/app/api/`.
- `src/lib/providers.ts` — single source of truth for the LLM provider
  matrix (URL building, headers, request body, response extraction, model
  listing). New providers go here.
- `src/lib/utils.ts` — pure helpers used by the translate pipeline
  (`splitIntoChunks`, `cleanTranslation`, `cn`). Add `*.test.ts` next to
  new pure functions.
- `src/lib/url-validation.ts` — currently just `stripTrailingSlash`; URL
  allow-listing lives inline in the API routes (see Security below).
- `src/components/ui/` — shadcn primitives; add new ones via the shadcn CLI
  rather than hand-rolling.
- `src/contexts/`, `src/hooks/` — `language-context`, `onboarding-context`,
  `use-mobile`, `use-tts`.

## Commands
Package manager is npm. No Makefile / task runner.

- `npm run dev` — `next dev` on :3000.
- `npm run build` — `next build`. Produces standalone output (see
  `next.config.ts`) used by the Dockerfile.
- `npm run start` — run the production build.
- `npm run lint` — `eslint` (uses `eslint-config-next` core-web-vitals +
  typescript; ignores `.next/`, `out/`, `build/`, `next-env.d.ts`,
  `website/`).
- `npm test` — `vitest run` (one-shot). **No vitest config file**; tests
  resolve with defaults, so any new test must use plain `import` syntax and
  live next to the code as `*.test.ts`.
- `npm run test:watch` — vitest watch mode.
- `npx vitest path/to/file.test.ts` — run a single test file.
- **There is no `typecheck` script.** Run `npx tsc --noEmit` manually if you
  need a full type pass; CI does not run it.

## CI gates (`.github/workflows/ci.yml`)
Three jobs on Node 20: `lint` and `test` run in parallel, then `build`
(`needs: [lint, test]`). PR template requires the author to tick all three
locally. Other workflows: `codeql.yml` (weekly + on PR), `docker-publish.yml`
(pushes to `ghcr.io` on `main` and `v*.*.*` tags), `release-drafter.yml`
(consumes Conventional Commits).

## Commit & branch conventions
Conventional Commits are required — Release Drafter reads them. Allowed
types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`,
`perf`, `build`. Branches: `type/short-description` from `main` (e.g.
`feat/italian-tone`, `fix/history-crash`).

## Security: SSRF pattern in API routes
`src/app/api/translate/route.ts`, `api/test-connection/route.ts`, and
`api/models/route.ts` all share a deliberate pattern: the request body
contains a user-supplied `url`, but the code **validates it for shape/host
and then fetches a hardcoded default**. This is intentional — using the
user URL directly in `fetch()` would trigger CodeQL's SSRF taint flow. If
you refactor these routes, **do not** inline the user URL into the
outbound `fetch()`; keep the allow-list + hardcoded-fetch pattern. Local
providers must hit loopback / `*.local` / RFC1918 ranges (see
`validateUrl` in `test-connection/route.ts`). Cloud providers
(`openai`/`anthropic`/`gemini`) are pinned to their canonical hostnames.

## Docker gotchas
- `next.config.ts` sets `output: "standalone"`; the Dockerfile copies
  `.next/standalone` and `.next/static`. Don't remove that.
- The default `LM_STUDIO_URL` baked into the image is
  `http://host.docker.internal:1234/...`. `docker-compose.yml` adds
  `extra_hosts: ["host.docker.internal:host-gateway"]` to make that
  resolve on Linux. If you run on Linux without Docker Desktop you'll need
  this extra_hosts entry.
- `NEXT_TELEMETRY_DISABLED=1` is set in the Dockerfile to silence Next's
  telemetry; keep it.

## Environment variables
There is **no `.env.local.example` in the repo** — variables are documented
in `README.md` § Configuration. Server-side keys: `LLM_PROVIDER`,
`LLM_API_KEY`, `LLM_MODEL`, `LLM_TEMPERATURE`, `LM_STUDIO_API_URL`,
`LM_STUDIO_MODEL`, `LM_STUDIO_TEMPERATURE`, `OLLAMA_API_URL`,
`CUSTOM_API_URL`. The client can also send per-request `provider`, `apiKey`,
`model`, `temperature` from Settings (stored in localStorage by
`src/app/settings/page.tsx`).

## Things that are easy to get wrong
- `splitIntoChunks` has a `preserveFormatting` flag that changes split
  behavior — pass `true` when chunking text where paragraph breaks matter
  (e.g. markdown); the default is fine for plain prose.
- Translation retries: 3 attempts with `1000 * (attempt + 1)` ms backoff,
  120s per-chunk timeout. `AbortError` is treated as a client-visible 504
  (short-text guidance) and is not retried.
- Tailwind v4 has **no** `tailwind.config.{js,ts}`; the config block in
  `components.json` points at an empty string and styling lives in
  `src/app/globals.css` via CSS variables. Don't reintroduce a JS config.
- `package.json` has an `overrides` and a `pnpm.overrides` block pinning
  `postcss`. If you switch to pnpm, the override still applies; if you
  switch to yarn, you may need to port it.
- Layout uses `next/font/google` for Geist fonts. CONTRIBUTING.md forbids
  remote font loading on privacy grounds, so this is a known tension —
  don't "fix" it by adding more remote fonts, and don't add a third-party
  font CDN.
