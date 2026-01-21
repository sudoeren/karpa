# Localce - AI-Powered Local Translation

<p align="center">
  <img src="public/localce-logo.png" alt="Localce Logo" width="200"/>
</p>

**Localce** is a privacy-focused translation application that runs entirely on your local machine using LM Studio. No data ever leaves your device.

## Features

- **100% Local & Private** - All translations happen on your machine
- **AI-Powered** - Uses LM Studio for high-quality translations
- **Multi-Language Support** - Translate between 12+ languages
- **Text & File Translation** - Translate text or upload files (.txt, .md, .json, .csv, .srt, and more)
- **Translation Tones** - Choose between Standard, Formal, Casual, or Technical tones
- **History & Favorites** - Save and revisit your translations
- **Dark Mode** - Beautiful light and dark themes
- **Multilingual Interface** - Available in English and Turkish

## Prerequisites

Before running Localce, you need to have [LM Studio](https://lmstudio.ai/) installed and running with a translation model.

### Recommended Model

For best translation results, we recommend using:
- **HY-MT1.5-7B** (hy-mt1.5-7b/HY-MT1.5-7B-Q4_K_M.gguf)

Or any other translation-capable model available in LM Studio.

## Installation

### Option 1: NPM (Development)

```bash
# Clone the repository
git clone https://github.com/sudoeren/localce.git
cd localce

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Docker (Production)

```bash
# Clone the repository
git clone https://github.com/sudoeren/localce.git
cd localce

# Build and run with Docker Compose
docker-compose up -d
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 3: Docker Build

```bash
# Build the image
docker build -t localce .

# Run the container
docker run -p 3000:3000 --add-host=host.docker.internal:host-gateway localce
```

## LM Studio Setup

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Download a translation model (e.g., HY-MT1.5-7B)
3. Start the local server on port `1234` (default)
4. Open Localce and start translating!

### Configuration

Localce connects to LM Studio at `http://localhost:1234` by default. You can configure this through environment variables:

```bash
# .env.local
LM_STUDIO_URL=http://localhost:1234/v1/chat/completions
LM_STUDIO_MODEL=hy-mt1.5-7b/HY-MT1.5-7B-Q4_K_M.gguf
LM_STUDIO_TEMPERATURE=0.2
```

## Usage

### Text Translation

1. Select source language (or use Auto Detect)
2. Select target language
3. Choose a translation tone (optional)
4. Enter or paste your text
5. Press `Ctrl+Enter` or click "Translate"

### File Translation

1. Switch to "File" mode in the header
2. Upload a text file (.txt, .md, .json, .csv, .srt, etc.)
3. Select target language and tone
4. Click "Translate"
5. Download the translated file

### History & Favorites

- **History**: All your translations are automatically saved
- **Favorites**: Click the star icon to save important translations
- Search through your history and favorites

## Tech Stack

- **Framework**: Next.js 16
- **UI**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **AI**: LM Studio (local LLM)
- **Animations**: Framer Motion

## Project Structure

```
localce/
├── src/
│   ├── app/                  # Next.js app router
│   │   ├── page.tsx         # Main translator
│   │   ├── history/         # History page
│   │   ├── favorites/       # Favorites page
│   │   ├── settings/        # Settings page
│   │   ├── about/           # About page
│   │   └── api/
│   │       └── translate/   # Translation API
│   ├── components/          # React components
│   ├── contexts/            # React contexts
│   └── lib/                 # Utilities & translations
├── public/                  # Static assets
├── Dockerfile              # Docker configuration
└── docker-compose.yml      # Docker Compose
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LM_STUDIO_URL` | `http://localhost:1234/v1/chat/completions` | LM Studio API endpoint |
| `LM_STUDIO_MODEL` | `hy-mt1.5-7b/HY-MT1.5-7B-Q4_K_M.gguf` | Model to use for translations |
| `LM_STUDIO_TEMPERATURE` | `0.2` | Model temperature (lower = more consistent) |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Developer

**Eren Cakar**

- Website: [erencakar.com](https://erencakar.com)
- GitHub: [@sudoeren](https://github.com/sudoeren)

---

<p align="center">
  Made with love and AI
</p>
