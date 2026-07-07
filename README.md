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
  <a href="#usage">Usage</a>
</p>

<p align="center">
  <img src="screenshot.png" alt="Karpa" width="800" />
</p>

Karpa is a privacy-first AI translator that runs entirely on your machine.
Your data never leaves your device — no cloud, no tracking, no compromises.

Supports LM Studio, Ollama, OpenAI, Anthropic, Google Gemini, and OpenRouter.

---

## Features

| Feature | Description |
|---|---|
| **Complete Privacy** | All translations happen locally. No data is ever sent to external servers. |
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

### Run Karpa

```bash
docker compose up -d
```

Open **http://localhost:7250** and start translating!

---

## Installation

### Option 1: Development

```bash
git clone https://github.com/sudoeren/karpa.git
cd karpa
npm install
npm run dev
```

### Option 2: Docker Compose

```bash
git clone https://github.com/sudoeren/karpa.git
cd karpa
docker-compose up -d
```

### Option 3: Docker Pull

```bash
docker run -p 7250:7250 ghcr.io/sudoeren/karpa:latest
```

For local LLM providers (LM Studio, Ollama), add the host gateway:
```bash
docker run -p 7250:7250 --add-host=host.docker.internal:host-gateway ghcr.io/sudoeren/karpa:latest
```

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
| `Ctrl+C`     | Copy translation |

---

## Project Structure

```
karpa/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main translator
│   │   ├── history/           # Translation history
│   │   ├── favorites/         # Saved translations
│   │   ├── settings/          # App settings
│   │   └── api/translate/     # Translation API
│   ├── components/            # React components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   └── lib/                   # Utilities
├── public/                    # Static assets
├── Dockerfile                # Docker config
└── docker-compose.yml        # Docker Compose
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.
