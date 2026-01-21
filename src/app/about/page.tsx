"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { 
  User, Globe, Github, Heart, Code, ExternalLink, 
  Mail, Sparkles, Coffee, Star
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import Link from "next/link"

const technologies = [
  { name: "Next.js 16", color: "bg-black dark:bg-white dark:text-black" },
  { name: "React 19", color: "bg-blue-500" },
  { name: "TypeScript", color: "bg-blue-600" },
  { name: "Tailwind CSS", color: "bg-cyan-500" },
  { name: "shadcn/ui", color: "bg-zinc-800 dark:bg-zinc-200 dark:text-black" },
  { name: "Framer Motion", color: "bg-purple-500" },
  { name: "LM Studio", color: "bg-green-500" },
]

const features = [
  { icon: Sparkles, text: "AI-Powered Translation" },
  { icon: Globe, text: "100% Local & Private" },
  { icon: Code, text: "Open Source" },
  { icon: Heart, text: "Free Forever" },
]

export default function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col h-full min-h-svh bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">{t.nav.translator}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <User className="size-4" />
                {t.about.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* App Info */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="relative size-24 rounded-2xl overflow-hidden bg-background shadow-xl mb-4">
                    <Image
                      src="/logo.png"
                      alt="Localce"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <h1 className="text-3xl font-bold mb-1">Localce</h1>
                  <Badge variant="secondary" className="mb-4">
                    {t.about.version} 2.2.0
                  </Badge>
                  <p className="text-muted-foreground max-w-md">
                    {t.about.description}
                  </p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {features.map((feature, i) => (
                    <div key={i} className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <feature.icon className="size-5 mb-2 text-primary" />
                      <span className="text-xs font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Developer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  {t.about.developer}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border">
                  <div className="relative size-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    EC
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Eren Cakar</h3>
                    <p className="text-sm text-muted-foreground">Full Stack Developer</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <Link href="https://erencakar.com" target="_blank">
                          <Globe className="size-3.5" />
                          {t.about.website}
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <Link href="https://github.com/sudoeren" target="_blank">
                          <Github className="size-3.5" />
                          GitHub
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technologies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="size-5" />
                  {t.about.technologies}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech) => (
                    <Badge
                      key={tech.name}
                      className={`${tech.color} text-white`}
                    >
                      {tech.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Open Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="size-5" />
                  {t.about.openSource}
                </CardTitle>
                <CardDescription>{t.about.openSourceDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full gap-2">
                  <Link href="https://github.com/sudoeren/localce" target="_blank">
                    <Github className="size-4" />
                    View on GitHub
                    <ExternalLink className="size-3.5 ml-auto" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Made with love */}
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                {t.about.madeWith}
                <Heart className="size-4 text-red-500 fill-red-500 animate-pulse" />
                by Eren Cakar
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                2024 Localce. All rights reserved.
              </p>
            </div>

          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
