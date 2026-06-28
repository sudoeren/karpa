# Contributing to Karpa

Thank you for your interest in contributing to Karpa! 🎉
Karpa is a privacy-first, open-source translation app. Every contribution — code, docs, bug reports, ideas — helps keep it that way.

## Code of Conduct

Be respectful, constructive, and inclusive. We're all here to build something useful.

## Ways to contribute

- 🐛 **Report bugs** via the [bug report template](../../issues/new?template=bug_report.md)
- ✨ **Suggest features** via the [feature request template](../../issues/new?template=feature_request.md)
- 🤖 **Suggest models or languages** via the [model suggestion template](../../issues/new?template=model_suggestion.md)
- 💬 **Help others** in [Discussions](../../discussions)
- 📖 **Improve docs** (README, in-app text, comments)
- 🔧 **Submit code** via Pull Requests
- ⭐ **Star the repo** — it really helps with discoverability

## Development setup

### Prerequisites

- **Node.js** ≥ 20
- **npm** (or pnpm/yarn — examples use npm)
- **LM Studio** with a translation model loaded and the local server running on `http://localhost:1234`

### Setup

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/sudoeren/karpa.git
cd karpa
npm install
cp .env.local.example .env.local  # if it exists, otherwise see README
npm run dev
```

Open <http://localhost:3000>.

### Useful scripts

| Command              | What it does                    |
| -------------------- | ------------------------------- |
| `npm run dev`        | Start the dev server with HMR   |
| `npm run build`      | Production build (`next build`) |
| `npm run start`      | Run the production build        |
| `npm run lint`       | Run ESLint (must pass for CI)   |
| `npm test`           | Run unit tests once with Vitest |
| `npm run test:watch` | Run Vitest in watch mode        |

## Pull Request workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b type/short-description
   # e.g. feat/italian-tone, fix/history-crash, docs/install-steps
   ```
2. **Make your changes** in small, focused commits.
3. **Write or update tests** when you change behavior in `src/lib/**`.
4. **Run the checks locally**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
5. **Push** and **open a Pull Request** against `main` using the PR template.
6. **Address review feedback** — pushes to your branch update the PR automatically.

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/) so [Release Drafter](.github/workflows/release-drafter.yml) can build changelogs automatically.

```
feat: add Italian to language picker
fix: prevent history crash on empty text
docs: clarify LM Studio setup steps
chore(deps): bump next to 16.1.4
ci: cache node_modules in CI
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `build`.

## Code style

- **TypeScript** is mandatory. Don't add `.js` files.
- **ESLint** must pass (`npm run lint`).
- Prefer **functional React components** and hooks.
- Use the existing **shadcn/ui** components in `src/components/ui/`. Add new ones via the shadcn CLI rather than hand-rolling.
- Keep the design system consistent with the rest of the app (Tailwind v4, `cn()` helper, Radix primitives).
- Do not add dependencies that ship telemetry or phone home.

## Privacy guidelines

Karpa's headline feature is that **nothing leaves your machine**. Any contribution that breaks this promise is almost certainly out of scope. Specifically:

- ❌ No third-party analytics, telemetry, or error reporting
- ❌ No remote font/CDN loading that leaks user IPs
- ❌ No "phone-home" license checks
- ✅ New outbound HTTP requests must go to a user-configurable URL only
- ✅ All translations must continue to work offline (with LM Studio on `localhost`)

If a feature genuinely requires a network call (e.g. an opt-in translation-memory sync), it must be **off by default** and **clearly disclosed** in the README and in-app UI.

## Project structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main translator
│   ├── history/           # Translation history
│   ├── favorites/         # Saved translations
│   ├── settings/          # App settings
│   └── api/translate/     # Translation API route
├── components/            # Reusable React components
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
└── lib/                   # Pure utilities (add unit tests here)
```

## Testing

- Tests live next to the code as `*.test.ts` files.
- Framework: [Vitest](https://vitest.dev/).
- Add tests for any new pure function in `src/lib/`.
- Component / integration tests are welcome but not required for small UI tweaks.

## Security

Please **do not** open public issues for security vulnerabilities. See [SECURITY.md](.github/SECURITY.md) for the private reporting process.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
