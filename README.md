<p align="center">
  <img src="public/logo.png" alt="Karpa" width="80" height="80" />
</p>

<h1 align="center">Karpa</h1>

<p align="center">
  <strong>Privacy-first AI translation that runs entirely on your machine</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#installation">Installation</a> •
  <a href="#desktop-app">Desktop App</a> •
  <a href="#usage">Usage</a>
</p>

Karpa is a privacy-first AI translator that runs entirely on your machine.
Your data never leaves your device — no cloud, no tracking, no compromises.

Supports LM Studio, Ollama, OpenAI, Anthropic, Google Gemini, and OpenRouter.

---

## Features

| Feature | Description |
|---|---|
| **Complete Privacy** | All translations happen locally. No data is ever sent to external servers. |
| **Desktop App** | Native Windows app built with Tauri. No browser needed. |
| **Multi-Language Support** | Translate between 12+ languages including English, Turkish, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, Korean, and Arabic. |
| **Text & File Translation** | Translate plain text or upload files (`.txt`, `.md`, `.json`, `.csv`, `.srt`, and more). |
| **Translation Tones** | Choose from Standard, Formal, Casual, or Technical tones to match your context. |
| **History & Favorites** | Automatically save your translation history and star your favorite translations. |
| **Beautiful UI** | Modern, responsive design with dark mode support and smooth animations. |
| **Text-to-Speech** | Listen to translations with built-in TTS support for multiple languages. |

---

## Quick Start

### Prerequisites

Pick one of the supported providers:
- **[LM Studio](https://lmstudio.ai/)** — Download, load a model, and start the local server
- **[Ollama](https://ollama.com/)** — Download and pull a model
- **OpenAI / Anthropic / Google Gemini / OpenRouter** — Create an account and get an API key

### Desktop App

Download the latest installer from [Releases](https://github.com/sudoeren/karpa/releases):

| Platform | Package |
|----------|---------|
| **Windows** | `Karpa_x64-setup.exe` (NSIS) / `Karpa_x64_en-US.msi` (MSI) |
| **macOS** | `Karpa_x64.dmg` |
| **Linux** | `Karpa_amd64.AppImage` / `Karpa_amd64.deb` |

### Run Karpa

```bash
git clone https://github.com/sudoeren/karpa.git && cd karpa
npm install && npm run dev
```

Open **http://localhost:7250** and start translating!

---

## Installation

### Option 1: Desktop App (Windows / macOS / Linux)

Build from source:
```bash
git clone https://github.com/sudoeren/karpa.git
cd karpa
npm install
npm run desktop:build
```

Output per platform:
```
Windows  → src-tauri/target/release/bundle/msi/*.msi
           src-tauri/target/release/bundle/nsis/*.exe
macOS    → src-tauri/target/release/bundle/dmg/*.dmg
Linux    → src-tauri/target/release/bundle/deb/*.deb
```

### Option 2: Development (Web)

```bash
git clone https://github.com/sudoeren/karpa.git
cd karpa
npm install
npm run dev
```

### Option 3: Docker Compose

```bash
git clone https://github.com/sudoeren/karpa.git
cd karpa
docker-compose up -d
```

### Option 4: Docker Pull

```bash
docker run -p 7250:7250 ghcr.io/sudoeren/karpa:latest
```

For local LLM providers (LM Studio, Ollama), add the host gateway:
```bash
docker run -p 7250:7250 --add-host=host.docker.internal:host-gateway ghcr.io/sudoeren/karpa:latest
```

---

## Desktop App

Karpa is also available as a native Windows desktop application built with [Tauri](https://tauri.app/).

### Development

```bash
npm run desktop:dev     # Start dev server + Tauri window
```

### Build

```bash
npm run desktop:build   # Build installer (MSI + NSIS)
```

Outputs:
```
src-tauri/target/release/bundle/nsis/Karpa_x64-setup.exe
src-tauri/target/release/bundle/msi/Karpa_x64_en-US.msi
```

### Architecture

The desktop app uses Next.js static export + Tauri WebView. All API calls (translate, test connection, model listing) go directly to your LLM provider via `fetch()` — no proxy, no server. The app is fully self-contained.

---

## Usage

### Text Translation

1. Select source language (or Auto Detect)
2. Select target language
3. Choose translation tone (optional)
4. Enter text
5. Press `Ctrl+Enter` or click **Translate**

### File Translation

1. Switch to **File** mode
2. Upload a text file
3. Select target language
4. Click **Translate**
5. Download the translated file

### Keyboard Shortcuts

| Shortcut     | Action           |
| ------------ | ---------------- |
| `Ctrl+Enter` | Translate        |

---

## Project Structure

```
karpa/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Main translator
│   │   ├── history/            # Translation history
│   │   ├── favorites/          # Saved translations
│   │   ├── settings/           # App settings
│   │   └── about/              # About page
│   ├── components/             # React components
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom hooks
│   └── lib/                    # Utilities & providers
│       ├── providers.ts        # LLM provider configs
│       ├── client-translate.ts # Client-side translation
│       ├── client-test-connection.ts
│       └── client-models.ts
├── public/                     # Static assets
├── src-tauri/                  # Tauri desktop app
│   ├── src/                    # Rust source
│   ├── icons/                  # App icons
│   ├── Cargo.toml
│   └── tauri.conf.json
├── Dockerfile
└── docker-compose.yml
```

---

## Uninstall

### Desktop App

- **Windows**: Settings → Apps, or re-run the installer
- **macOS**: Drag from Applications to Trash
- **Linux**: `sudo dpkg -r karpa` or remove the AppImage file

### Docker

Run the script inside the karpa folder:
```bash
./uninstall.sh          # macOS / Linux
uninstall.bat           # Windows
```

Clear browser data (history, settings, API key) manually from Settings → Data.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
