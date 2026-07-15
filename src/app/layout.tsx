import type { Metadata } from "next";
import "./globals.css";
import { IconProvider } from "@/components/icon-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { Toaster } from "@/components/ui/sonner";
import { FloatingNavbar } from "@/components/floating-navbar";
import { MobileNav } from "@/components/mobile-nav";
import { AppWrapper } from "@/components/app-wrapper";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

export const metadata: Metadata = {
  title: "Karpa | Yerel & Güvenli Yapay Zeka Çevirmeni",
  description: "Gizlilik odaklı, yerel ve hızlı yapay zeka çevirisi. Verileriniz asla cihazınızdan çıkmaz. LM Studio, Ollama ve popüler bulut modellerini destekler.",
  keywords: ["çeviri", "yapay zeka", "yerel", "gizlilik", "translator", "AI", "local", "privacy", "LM Studio", "Ollama"],
  authors: [{ name: "Eren Cakar", url: "https://erencakar.com" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Karpa | AI Translator",
    description: "Privacy-first AI translation that runs entirely on your browser and local machine.",
    url: "https://karpa.app",
    siteName: "Karpa",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Karpa Logo",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground transition-colors duration-300">
        <IconProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <OnboardingProvider>
              <AppWrapper>
                <KeyboardShortcuts />
                <main className="h-svh w-full bg-background transition-colors duration-300 overflow-hidden flex flex-col">
                  <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-hidden">
                    {children}
                  </div>
                  <div className="h-24 shrink-0" /> {/* Navbar spacer */}
                </main>
                <div className="hidden md:block">
                  <FloatingNavbar />
                </div>
                <MobileNav />
              </AppWrapper>
            </OnboardingProvider>
          </LanguageProvider>
          <Toaster />
        </ThemeProvider>
        </IconProvider>
      </body>
    </html>
  );
}
