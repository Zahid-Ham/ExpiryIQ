"use client"

import * as React from "react"
import Link from "next/link"
import { APP_NAME } from "@/constants"
import { ShieldCheck } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card relative overflow-hidden">
      {/* Subtle dotted background grid decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16 relative z-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4 col-span-1 sm:col-span-2 md:col-span-2 text-left">
            <Link href="#" className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold tracking-tight text-foreground">{APP_NAME}</span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-semibold">
              Enterprise expiry tracking engine engineered to govern critical operational dates, software licenses, domain registries, facility leases, and document compliance.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product</h3>
            <ul className="space-y-2.5 text-xs font-semibold text-muted-foreground">
              <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link href="#benefits" className="hover:text-foreground transition-colors">Benefits</Link></li>
              <li><Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Resources & Socials Links */}
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resources</h3>
            <ul className="space-y-2.5 text-xs font-semibold text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
              <li><Link href="mailto:support@expiryiq.com" className="hover:text-foreground transition-colors">Support Email</Link></li>
              <li>
                <div className="flex space-x-4 pt-1">
                  {/* GitHub Inline SVG */}
                  <Link href="https://github.com" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                      <path d="M9 18c-4.51 2-5-2-7-2" />
                    </svg>
                  </Link>
                  {/* Twitter Inline SVG */}
                  <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                  </Link>
                  {/* LinkedIn Inline SVG */}
                  <Link href="https://linkedin.com" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect width="4" height="12" x="2" y="9" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </Link>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Area */}
        <div className="mt-12 pt-8 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-center text-[10px] text-muted-foreground font-semibold sm:order-1">
            &copy; {currentYear} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex space-x-6 text-[10px] font-semibold text-muted-foreground sm:order-2">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
