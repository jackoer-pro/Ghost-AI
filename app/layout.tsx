import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Collaborative system design workspace",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          appearance={{
            theme: dark,
            variables: {
              colorBackground: "var(--bg-surface)",
              colorForeground: "var(--foreground)",
              colorPrimary: "var(--accent-primary)",
              colorPrimaryForeground: "var(--primary-foreground)",
              colorMuted: "var(--muted)",
              colorMutedForeground: "var(--muted-foreground)",
              colorInput: "var(--bg-elevated)",
              colorInputForeground: "var(--foreground)",
              colorBorder: "var(--border)",
              colorRing: "var(--ring)",
              colorDanger: "var(--state-error)",
              colorSuccess: "var(--state-success)",
              colorWarning: "var(--state-warning)",
              fontFamily: "var(--font-geist-sans)",
              borderRadius: "var(--radius)",
            },
          }}
        >
          {/* Shared hover delay for all tooltips; moving between controls then shows labels instantly. */}
          <TooltipProvider delay={300}>{children}</TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
