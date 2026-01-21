"use client"

import { useLanguage } from "@/contexts/language-context"
import { motion } from "framer-motion"
import { 
  Github, Globe, Heart, Code2, Shield, Zap,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function AboutPage() {
  const { t } = useLanguage()

  const features = [
    { icon: Shield, title: "100% Private", desc: "All data stays on your device" },
    { icon: Zap, title: "AI Powered", desc: "Using local LLM via LM Studio" },
    { icon: Code2, title: "Open Source", desc: "Free and open source forever" },
  ]

  const technologies = [
    "Next.js 16", "React 19", "TypeScript", "Tailwind CSS", 
    "shadcn/ui", "Framer Motion", "LM Studio"
  ]

  return (
    <div className="min-h-[calc(100svh-5rem)] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-card/50 backdrop-blur-xl border rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
{/* Header */}
          <div className="relative p-8 text-center bg-gradient-to-b from-primary/10 to-transparent">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="inline-flex items-center justify-center mb-4"
            >
              <Logo size={64} />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
            >
              Localce
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground mt-1"
            >
              {t.about.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Badge variant="secondary" className="mt-3">
                v1.0.0
              </Badge>
            </motion.div>
          </div>

          {/* Features */}
          <div className="px-6 py-4 border-t border-b bg-muted/20">
            <div className="grid grid-cols-3 gap-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center size-10 rounded-xl bg-primary/10 mb-2">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium">{feature.title}</p>
                  <p className="text-[10px] text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Developer */}
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50"
            >
              <div className="size-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                EC
              </div>
              <div className="flex-1">
                <p className="font-semibold">Eren Cakar</p>
                <p className="text-xs text-muted-foreground">{t.about.developer}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg" asChild>
                    <Link href="https://erencakar.com" target="_blank">
                      <Globe className="size-3.5 mr-1" />
                      <span className="text-xs">Website</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg" asChild>
                    <Link href="https://github.com/sudoeren" target="_blank">
                      <Github className="size-3.5 mr-1" />
                      <span className="text-xs">GitHub</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Technologies */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4"
            >
              <p className="text-xs text-muted-foreground mb-2">{t.about.technologies}</p>
              <div className="flex flex-wrap gap-1.5">
                {technologies.map((tech) => (
                  <Badge key={tech} variant="outline" className="text-[10px] font-normal">
                    {tech}
                  </Badge>
                ))}
              </div>
            </motion.div>

            {/* Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 pt-4 border-t"
            >
              <Button variant="outline" className="w-full rounded-xl gap-2" asChild>
                <Link href="https://github.com/sudoeren/localce" target="_blank">
                  <Github className="size-4" />
                  {t.about.openSource}
                  <ExternalLink className="size-3 ml-auto" />
                </Link>
              </Button>
            </motion.div>

            {/* Made with */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1"
            >
              {t.about.madeWith} <Heart className="size-3 text-red-500 fill-red-500" /> in Turkey
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
