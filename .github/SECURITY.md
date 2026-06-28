# Security Policy

## Supported Versions

The following versions of Karpa receive security updates:

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Karpa is a **privacy-first** project. If you discover a security vulnerability, please report it **privately** so we can address it before public disclosure.

**Please do NOT open a public GitHub issue for security vulnerabilities.**

### How to report

Use one of the following channels (in order of preference):

1. **GitHub Security Advisories** (recommended)
   Go to the **Security** tab of this repository → **"Report a vulnerability"** → fill in the form.

2. **Email**
   Send details to the maintainer listed in [`CODEOWNERS`](./CODEOWNERS) or the repository owner profile.

### What to include

- A clear description of the vulnerability and its impact
- Steps to reproduce (proof-of-concept preferred)
- Affected version/commit
- Any known mitigations
- Your name/handle for credit (optional)

### What to expect

- **Initial response**: within 72 hours
- **Status update**: within 7 days
- **Patch timeline**: critical issues are prioritized; we aim to ship a fix within 30 days

We follow [coordinated disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure) and will credit reporters in the release notes (unless you prefer to remain anonymous).

## Security Design Notes

Karpa is designed with the following security principles:

- **Local-only execution** — All translations happen on your machine via LM Studio. No text is ever sent to remote servers owned by Karpa.
- **No telemetry** — Next.js telemetry is explicitly disabled in the Docker image (`NEXT_TELEMETRY_DISABLED=1`).
- **Non-root container** — The Docker image runs as a dedicated unprivileged `nextjs` user.
- **Outbound network** — The only outbound request the app makes is to the user-configured `LM_STUDIO_URL` (default: `http://localhost:1234`).

If you find that the application unexpectedly opens network connections to a destination other than `LM_STUDIO_URL`, please report it.

## Scope

In scope:

- Cross-site scripting (XSS) in the web UI
- Server-side request forgery (SSRF) in the translation API route
- Arbitrary code execution via crafted model responses
- Container escape / privilege escalation
- Dependency vulnerabilities with realistic exploit paths

Out of scope:

- Issues in third-party models running in LM Studio
- Issues requiring physical access to the user's machine
- Denial of service against the user's own machine

Thank you for helping keep Karpa and its users safe.
