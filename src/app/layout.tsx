import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { Toaster } from "@/components/ui/sonner";
import { FloatingNavbar } from "@/components/floating-navbar";
import { MobileNav } from "@/components/mobile-nav";
import { AppWrapper } from "@/components/app-wrapper";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Localce | AI Translator",
  description: "Secure, local, and fast AI translation powered by LM Studio.",
  keywords: ["translator", "AI", "local", "privacy", "LM Studio"],
  authors: [{ name: "Eren Cakar", url: "https://erencakar.com" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-300`}
      >
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
      </body>
    </html>
  );
}
