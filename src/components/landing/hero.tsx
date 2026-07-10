"use client"

import * as React from "react"
import Link from "next/link"
import { ROUTES } from "@/constants"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, AlertTriangle, Play, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  } as const

  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-28 lg:py-36 border-b border-border bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] sm:h-[500px] sm:w-[500px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[80px] sm:blur-[120px] -z-10 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Copy & CTAs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col space-y-6 text-left lg:col-span-6"
          >
            {/* Trust Badge */}
            <motion.div variants={itemVariants} className="inline-flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3 animate-pulse" />
                <span>Enterprise Renewal Intelligence</span>
              </span>
            </motion.div>

            {/* Bold Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl leading-[1.05] max-w-xl"
            >
              Stay ahead of expirations.{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Always.
              </span>
            </motion.h1>

            {/* Paragraph Focus on Document Expiries */}
            <motion.p
              variants={itemVariants}
              className="max-w-lg text-base sm:text-lg text-muted-foreground leading-relaxed font-medium"
            >
              ExpiryIQ helps operations teams track critical records, automate renewal workflows, and prevent costly surprises before documents expire.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 pt-2"
            >
              <Button size="lg" asChild className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-400 dark:hover:to-indigo-400 text-white shadow-md border-0 transition-all duration-200">
                <Link href={ROUTES.SIGNUP} className="flex items-center gap-2">
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-border/80 hover:bg-muted/50 transition-colors gap-2">
                <Link href="#how-it-works" className="flex items-center gap-2">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>See How It Works</span>
                </Link>
              </Button>
            </motion.div>

            {/* Micro Badges */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center gap-6 text-xs text-muted-foreground font-semibold pt-4"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>14-day free trial</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Glow Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            className="relative lg:col-span-6 flex justify-center"
          >
            {/* Visual glow backdrop for mockup */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent blur-[30px] rounded-2xl -z-10" />

            {/* Mockup Container */}
            <div className="w-full max-w-xl rounded-xl border border-border/80 bg-card/60 dark:bg-card/40 backdrop-blur-md shadow-2xl p-4 relative group hover:border-primary/30 transition-all duration-300">
              {/* Browser bar */}
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex space-x-1.5">
                  <span className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <span className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <span className="h-3 w-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="h-4 w-28 rounded bg-muted/65" />
                <div className="w-6" />
              </div>

              {/* Mockup content */}
              <div className="space-y-3">
                {/* Critical */}
                <div className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20 p-3 hover:bg-rose-500/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-md bg-rose-500/10">
                      <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-foreground">Global SSL Certificate</div>
                      <div className="text-[10px] text-muted-foreground font-medium">Expires in 3 Days</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-500 border border-rose-500/20">
                    Critical
                  </span>
                </div>

                {/* Warning */}
                <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 p-3 hover:bg-amber-500/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-md bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-foreground">SaaS Office Software Suite</div>
                      <div className="text-[10px] text-muted-foreground font-medium">Expires in 14 Days</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                    Warning
                  </span>
                </div>

                {/* Active */}
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-950/20 p-3 hover:bg-emerald-500/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-md bg-emerald-500/10">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-foreground">HQ Office Lease Contract</div>
                      <div className="text-[10px] text-muted-foreground font-medium">Expires in 180 Days</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
