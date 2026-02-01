"use client"

import { useLanguage } from "@/contexts/language-context"
import { motion } from "framer-motion"
import { Github, Globe } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100svh-4rem)] p-6 select-none">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center max-w-xs mx-auto space-y-12"
      >
        {/* Brand Section */}
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Logo size={56} />
          </motion.div>
          
          <div className="space-y-3">
            <h1 className="text-lg font-medium tracking-tight text-foreground">
              Localce
            </h1>
            <p className="text-sm text-muted-foreground/80 leading-relaxed font-light">
              {t.about.description}
            </p>
          </div>
        </div>

        {/* Developer Section */}
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-medium">
              {t.about.developer}
            </p>
            <p className="text-sm font-medium text-foreground/80">
              Eren Cakar
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-5">
            <Link 
              href="https://erencakar.com" 
              target="_blank" 
              className="text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
            >
              <Globe className="size-4" />
              <span className="sr-only">Website</span>
            </Link>
            <Link 
              href="https://github.com/sudoeren" 
              target="_blank" 
              className="text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
            >
              <Github className="size-4" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>
        </div>

        {/* Footer / Version */}
        <div className="pt-4">
          <Link 
            href="https://github.com/sudoeren/localce" 
            target="_blank"
            className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors font-mono"
          >
            v1.0.0
          </Link>
        </div>
      </motion.div>
    </div>
  )
}