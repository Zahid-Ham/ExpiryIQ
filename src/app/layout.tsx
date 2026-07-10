import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExpiryIQ - Expiry & Renewal Tracking System",
  description: "Manage records with expiry dates and track renewals proactively.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TooltipProvider>
              {children}
              <ToastProvider />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
