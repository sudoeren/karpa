"use client"

import { useLanguage } from "@/contexts/language-context"
import { motion } from "framer-motion"
import { Github, Globe, Heart, Code2, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  const { t } = useLanguage()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100svh-4rem)] p-6 md:p-12">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-2xl w-full space-y-12"
      >
        {/* Header Section */}
        <motion.div variants={item} className="flex flex-col items-center text-center space-y-6">
          <div className="relative group cursor-default">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-700" />
            <div className="relative transform transition-transform duration-500 hover:scale-105 hover:rotate-3">
              <Logo size={80} />
            </div>
          </div>
          
          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
              Localce
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.about.description}
            </p>
          </div>
        </motion.div>

        {/* Info Grid */}
        <motion.div variants={item} className="grid md:grid-cols-2 gap-6">
          {/* Developer Card */}
          <div className="group relative overflow-hidden rounded-3xl border bg-card/50 hover:bg-card/80 transition-colors p-6 md:p-8">
            <div className="flex flex-col h-full justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground/60 text-xs font-mono uppercase tracking-wider">
                  <Code2 className="size-3" />
                  {t.about.developer}
                </div>
                <h3 className="text-xl font-medium text-foreground">Eren Cakar</h3>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" className="rounded-full gap-2 h-9 text-xs group-hover:border-foreground/20 transition-colors" asChild>
                  <Link href="https://erencakar.com" target="_blank">
                    <Globe className="size-3.5" />
                    Website
                    <ArrowUpRight className="size-3 opacity-50" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="rounded-full gap-2 h-9 text-xs group-hover:border-foreground/20 transition-colors" asChild>
                  <Link href="https://github.com/sudoeren" target="_blank">
                    <Github className="size-3.5" />
                    GitHub
                    <ArrowUpRight className="size-3 opacity-50" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Project Card */}
          <div className="group relative overflow-hidden rounded-3xl border bg-card/50 hover:bg-card/80 transition-colors p-6 md:p-8">
            <div className="flex flex-col h-full justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground/60 text-xs font-mono uppercase tracking-wider">
                  <Github className="size-3" />
                  {t.about.openSource}
                </div>
                <h3 className="text-xl font-medium text-foreground">Public Repository</h3>
              </div>

              <div>
                <Button className="w-full rounded-full gap-2 h-10 group-hover:bg-primary/90 transition-colors" asChild>
                  <Link href="https://github.com/sudoeren/localce" target="_blank">
                    <Github className="size-4" />
                    {t.about.openSource}
                    <ArrowUpRight className="size-3.5 opacity-50" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={item} className="flex flex-col items-center justify-center gap-4 pt-8 border-t border-border/40">
           <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
             <span>v1.0.0</span>
             <span className="w-1 h-1 rounded-full bg-border" />
             <span className="flex items-center gap-1.5">
               {t.about.madeWith} <Heart className="size-3.5 text-red-500 fill-red-500 animate-pulse" /> in Turkey
             </span>
           </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
