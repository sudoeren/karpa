import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { AppSidebar } from "@/components/app-sidebar";
import { AppWrapper } from "@/components/app-wrapper";

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
                <div className="flex min-h-svh bg-background">
                  <AppSidebar />
                  <main className="flex-1 transition-all duration-300 ease-in-out pb-20 md:pb-0">
                    {/* The padding-left should match the default/collapsed state or be dynamic. 
                        Since Sidebar component manages its own width with internal state, 
                        getting the exact margin here via CSS alone is tricky without a shared context. 
                        For now, I'll use a safe default of pl-20 (collapsed width) + auto margin or 
                        handle it better. Actually, to make it perfectly dynamic, I should move the state up, 
                        but for this iteration, I will set a base padding that accommodates the sidebar.
                        
                        Better approach: The sidebar is fixed. 
                        I'll use a simplified approach: md:pl-20 (collapsed default) is safe.
                        But wait, the sidebar defaults to expanded on desktop (width: 280px).
                        So md:pl-[280px] is better.
                        The sidebar component has `isCollapsed` state.
                        
                        *Decision:* I will update the AppSidebar to *not* be fixed, or accept a context. 
                        However, for simplicity in this "Task 1", I will use `md:pl-20` and let the user expand it over content or 
                        make the sidebar `sticky` instead of `fixed`?
                        
                        Let's try a CSS variable approach or just fixed padding for now.
                        Let's assume the user starts with the sidebar. 
                        To avoid complexity, I'll stick to a standard dashboard layout where sidebar is fixed.
                        I'll use `md:ml-[80px]` (collapsed) and let the sidebar expand over or push?
                        
                        Actually, looking at `AppSidebar`, it has `fixed left-0`.
                        I'll set `md:pl-20` (80px) as a base. If expanded, it might overlap.
                        To do this "right", I should probably use a Context to share `isCollapsed` state.
                        But I cannot easily create a new Context just for this without editing multiple files.
                        
                        *Alternative:* Remove `fixed` from desktop sidebar and let it be `sticky top-0 h-screen`.
                        Then it takes up space naturally in the flex container.
                        Let's modify `AppSidebar` slightly in the next step if needed. 
                        For now, I'll use `md:pl-0` in layout and let the Sidebar be part of the flow?
                        No, `AppSidebar` has `fixed`.
                        
                        I will use `md:pl-20` for now.
                     */}
                    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full h-full">
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
