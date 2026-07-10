"use client"

import * as React from "react"
import Link from "next/link"
import { ROUTES } from "@/constants"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTA() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute top-0 left-1/4 h-[300px] w-[300px] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[80px] -z-10 pointer-events-none" />

      <div className="mx-auto max-w-5xl px-6">
        {/* Main CTA Block with Gradient Background & Soft Shapes */}
        <div className="relative rounded-3xl overflow-hidden border border-primary/20 dark:border-primary/30 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 p-8 sm:p-12 md:p-16 text-center space-y-6 shadow-xl backdrop-blur-sm">
          {/* Decorative Soft Circles inside card */}
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="inline-flex mx-auto">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span>Instant Setup</span>
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl max-w-2xl mx-auto leading-tight">
            Ready to prevent your next surprise expiration?
          </h2>

          {/* Subheading */}
          <p className="mx-auto max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed font-semibold">
            Centralize your records in minutes, automate notifications, and keep operations running cleanly. No credit card required.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 relative z-10">
            <Button size="lg" asChild className="group shadow-md hover:shadow-lg bg-primary hover:bg-primary/95 transition-all">
              <Link href={ROUTES.SIGNUP} className="flex items-center gap-2">
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-border bg-background/50 hover:bg-muted/50 transition-colors">
              <Link href="mailto:sales@expiryiq.com">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
