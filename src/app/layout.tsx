import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { AppWrapper } from "@/components/app-wrapper";
import { FloatingNavbar } from "@/components/floating-navbar";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
                <main className="min-h-svh bg-gradient-to-br from-background via-background to-muted/20">
                  {children}
                </main>
                <FloatingNavbar />
              </AppWrapper>
            </OnboardingProvider>
          </LanguageProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
