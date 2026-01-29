import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { Toaster } from "@/components/ui/sonner";
import { SimpleSidebar } from "@/components/simple-sidebar";
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
                    // Force dark mode if amoled is on, just to be safe for initial paint
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
                <div className="flex min-h-svh">
                  <SimpleSidebar />
                  <main className="flex-1 w-full min-w-0 bg-background transition-colors duration-300">
                     {/* Mobile Header Spacer */}
                     <div className="h-16 md:hidden" />
                     <div className="h-full p-4 md:p-8 max-w-7xl mx-auto">
                        {children}
                     </div>
                  </main>
                </div>
              </AppWrapper>
            </OnboardingProvider>
          </LanguageProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
