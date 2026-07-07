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
  <a href="#usage">Usage</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

Traditional translation services send your text to remote servers. **Karpa is different** — it uses LM Studio to run AI models locally on your computer. Your data never leaves your device.

| Feature           | Karpa          | Cloud Services          |
| ----------------- | ---------------- | ----------------------- |
| Privacy           | ✅ 100% Local    | ❌ Data sent to servers |
| Internet Required | ❌ Works offline | ✅ Always required      |
| Cost              | ✅ Free forever  | ❌ Usually paid         |
| Speed             | ✅ Instant       | ❌ Network latency      |

---

## Features

| Feature | Description |
|---|---|
| **Complete Privacy** | All translations happen locally using LM Studio. No data is ever sent to external servers. |
| **Multi-Language Support** | Translate between 12+ languages including English, Turkish, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, Korean, and Arabic. |
| **Text & File Translation** | Translate plain text or upload files (`.txt`, `.md`, `.json`, `.csv`, `.srt`, and more). |
| **Translation Tones** | Choose from Standard, Formal, Casual, or Technical tones to match your context. |
| **History & Favorites** | Automatically save your translation history and star your favorite translations. |
| **Beautiful UI** | Modern, responsive design with dark mode support and smooth animations. |
| **Text-to-Speech** | Listen to translations with built-in TTS support for multiple languages. |

---

## Quick Start

### Prerequisites

1. **[LM Studio](https://lmstudio.ai/)** — Download and install
2. **Translation Model** — Download a model (recommended: `HY-MT1.5-7B`)
3. **Start Local Server** — Run LM Studio's local server on port `1234`

### Run Karpa

```bash
# Clone
git clone https://github.com/sudoeren/karpa.git && cd karpa

# Install
npm install

# Start
npm run dev
```

Open **http://localhost:3000** and start translating!

---

## Installation

### Option 1: Development

```bash
git clone https://github.com/sudoeren/karpa.git
cd karpa
npm install
npm run dev
```

### Option 2: Docker

```bash
git clone https://github.com/sudoeren/karpa.git
cd karpa
docker-compose up -d
```

### Option 3: Docker Build

```bash
docker build -t karpa .
docker run -p 3000:3000 --add-host=host.docker.internal:host-gateway karpa
```

---

## Usage

<p align="center">
  <kbd>
    <img src="screenshot.png" alt="Karpa Screenshot" width="800" />
  </kbd>
</p>

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

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
LM_STUDIO_URL=http://localhost:1234/v1/chat/completions
LM_STUDIO_MODEL=hy-mt1.5-7b/HY-MT1.5-7B-Q4_K_M.gguf
LM_STUDIO_TEMPERATURE=0.2
```

### In-App Settings

Navigate to **Settings** to configure:

- LM Studio connection URL
- Model temperature
- Theme (Light/Dark/System)
- Language (English/Turkish)

---

## Tech Stack

| Category   | Technology           |
| ---------- | -------------------- |
| Framework  | Next.js 16           |
| UI Library | React 19             |
| Language   | TypeScript           |
| Styling    | Tailwind CSS v4      |
| Components | shadcn/ui + Radix UI |
| Animations | Framer Motion        |
| AI Backend | LM Studio            |

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.
