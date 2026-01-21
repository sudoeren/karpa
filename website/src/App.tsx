import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { 
  Shield, Zap, Globe, Download, Github, 
  ArrowRight, Check, Star, Languages, 
  FileText, History, Heart, ChevronDown,
  Moon, Sun, Menu, X
} from 'lucide-react'
import './App.css'

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const features = [
    {
      icon: Shield,
      title: "100% Private",
      description: "All translations happen locally on your device. Your data never leaves your machine.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Zap,
      title: "AI Powered",
      description: "Leverages powerful local LLMs through LM Studio for accurate, context-aware translations.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Globe,
      title: "12+ Languages",
      description: "Translate between English, Turkish, Spanish, French, German, and many more languages.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Languages,
      title: "Multiple Tones",
      description: "Choose from Standard, Formal, Casual, or Technical tones to match your context.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: FileText,
      title: "File Translation",
      description: "Upload and translate entire files including .txt, .md, .json, .csv, and more.",
      color: "from-indigo-500 to-violet-500"
    },
    {
      icon: History,
      title: "History & Favorites",
      description: "Save your translation history and star your favorite translations for quick access.",
      color: "from-rose-500 to-red-500"
    }
  ]

  const techStack = [
    "Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4",
    "shadcn/ui", "Framer Motion", "LM Studio"
  ]

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-zinc-950' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-blur border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-lg text-white">Localce</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#tech" className="text-sm text-zinc-400 hover:text-white transition-colors">Tech Stack</a>
            <a href="https://github.com/sudoeren/localce" target="_blank" className="text-sm text-zinc-400 hover:text-white transition-colors">GitHub</a>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400"
            >
              {darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <a 
              href="https://github.com/sudoeren/localce" 
              target="_blank"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              <Github className="size-4" />
              Star on GitHub
            </a>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-zinc-800 bg-zinc-950 p-4 space-y-4"
          >
            <a href="#features" className="block text-sm text-zinc-400 hover:text-white">Features</a>
            <a href="#tech" className="block text-sm text-zinc-400 hover:text-white">Tech Stack</a>
            <a href="https://github.com/sudoeren/localce" target="_blank" className="block text-sm text-zinc-400 hover:text-white">GitHub</a>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div 
          style={{ opacity, scale }}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-8"
          >
            <Shield className="size-4" />
            Privacy-First Translation
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-white"
          >
            Translate Locally,
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Stay Private
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10"
          >
            Localce is an AI-powered translation app that runs entirely on your machine.
            No cloud servers, no data collection, just pure local translation.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="https://github.com/sudoeren/localce/releases"
              target="_blank"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25"
            >
              <Download className="size-5" />
              Download Now
              <ArrowRight className="size-4" />
            </a>
            <a 
              href="https://github.com/sudoeren/localce"
              target="_blank"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
            >
              <Github className="size-5" />
              View Source
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-16"
          >
            {[
              { value: "12+", label: "Languages" },
              { value: "100%", label: "Private" },
              { value: "Free", label: "Forever" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="p-2 rounded-full bg-zinc-800/50"
          >
            <ChevronDown className="size-5 text-zinc-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">Everything You Need</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Powerful features designed with privacy and simplicity in mind
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/5"
              >
                <div className={`inline-flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="size-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">Why Localce?</h2>
            <p className="text-zinc-400">See how we compare to cloud-based translation services</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/50"
          >
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-zinc-800 bg-zinc-800/50">
              <div className="font-medium text-white">Feature</div>
              <div className="font-medium text-center text-violet-400">Localce</div>
              <div className="font-medium text-center text-zinc-500">Cloud Services</div>
            </div>
            {[
              { feature: "Privacy", localce: "100% Local", cloud: "Data sent to servers" },
              { feature: "Internet Required", localce: "Works offline", cloud: "Always required" },
              { feature: "Cost", localce: "Free forever", cloud: "Usually paid" },
              { feature: "Speed", localce: "Instant", cloud: "Network latency" },
              { feature: "Data Ownership", localce: "You own it", cloud: "Stored on servers" }
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 p-4 border-b border-zinc-800 last:border-0">
                <div className="text-sm text-zinc-300">{row.feature}</div>
                <div className="flex items-center justify-center gap-2 text-sm text-green-400">
                  <Check className="size-4" />
                  {row.localce}
                </div>
                <div className="flex items-center justify-center text-sm text-zinc-500">
                  {row.cloud}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">Built with Modern Tech</h2>
            <p className="text-zinc-400">Powered by the latest and greatest technologies</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3"
          >
            {techStack.map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-sm font-medium text-zinc-300"
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 p-12 text-center border border-violet-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10" />
          <div className="relative z-10">
            <Star className="size-12 mx-auto mb-6 text-yellow-500" />
            <h2 className="text-4xl font-bold mb-4 text-white">Ready to Start?</h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              Download Localce now and experience the freedom of private, local AI translation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://github.com/sudoeren/localce/releases"
                target="_blank"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-zinc-900 font-medium hover:bg-zinc-200 transition-colors"
              >
                <Download className="size-5" />
                Download Now
              </a>
              <a 
                href="https://github.com/sudoeren/localce"
                target="_blank"
                className="flex items-center gap-2 px-8 py-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors font-medium text-white"
              >
                <Github className="size-5" />
                Star on GitHub
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-white">Localce</span>
          </div>
          
          <p className="text-sm text-zinc-500 flex items-center gap-1.5">
            Made with <Heart className="size-4 text-red-500 fill-red-500" /> by{' '}
            <a href="https://erencakar.com" target="_blank" className="text-white hover:underline">
              Eren Cakar
            </a>
          </p>
          
          <div className="flex items-center gap-4">
            <a href="https://github.com/sudoeren/localce" target="_blank" className="text-zinc-500 hover:text-white transition-colors">
              <Github className="size-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
