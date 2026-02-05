import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { Toaster } from "@/components/ui/sonner";
import { FloatingNavbar } from "@/components/floating-navbar";
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const amoled = localStorage.getItem('localce-amoled');
                  const theme = localStorage.getItem('theme');
                  const element = document.documentElement;
                  
                  if (amoled === 'true') {
                    element.classList.add('amoled');
                    element.classList.add('dark');
                    element.style.backgroundColor = '#000000';
                  } else {
                    element.classList.remove('amoled');
                    element.style.backgroundColor = '';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
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
                <main className="min-h-svh w-full bg-background transition-colors duration-300 pb-28">
                   <div className="p-4 md:p-8 max-w-5xl mx-auto">
                      {children}
                   </div>
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
