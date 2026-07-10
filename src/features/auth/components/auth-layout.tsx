"use client"

import * as React from "react"
import { ShieldCheck, Sparkles, Check } from "lucide-react"
import { APP_NAME } from "@/constants"
import { motion } from "framer-motion"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const benefits = [
    "Prevent costly service outages from forgotten expiries",
    "Reduce redundant software subscriptions and spend",
    "Establish clear record ownership and audit trails"
  ]

  return (
    <div className="h-screen grid lg:grid-cols-12 overflow-hidden bg-background">
      {/* Left Column - Branding and Illustration (Desktop Only) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-muted/20 border-r border-border relative overflow-hidden select-none h-full">
        {/* Subtle background dotted pattern and radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-primary/5 blur-[80px] -z-10 pointer-events-none" />

        {/* Branding header */}
        <div className="relative z-10 flex items-center space-x-2.5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">{APP_NAME}</span>
        </div>

        {/* Hero copy and Illustration */}
        <div className="space-y-10 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                <span>Enterprise Security</span>
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
              Stay ahead of expirations.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Always.
              </span>
            </h2>
          </div>

          {/* Mini Dashboard Illustration Mockup */}
          <div className="rounded-xl border border-border bg-card/65 backdrop-blur-md p-4 space-y-2.5 max-w-sm shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Operational Risks</span>
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            </div>
            {[
              { name: "Global SSL Certificate", left: "3 Days", badge: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
              { name: "SaaS Software Suite", left: "14 Days", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
              { name: "Office Lease Contract", left: "94 Days", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" }
            ].map((mock, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/60 text-xs">
                <span className="font-bold text-foreground">{mock.name}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${mock.badge}`}>
                  {mock.left}
                </span>
              </div>
            ))}
          </div>

          {/* Benefits list */}
          <div className="space-y-3.5 pt-4 border-t border-border/80">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start space-x-2.5">
                <div className="p-0.5 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground leading-normal">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer brand */}
        <div className="relative z-10 text-[10px] text-muted-foreground font-semibold">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>

      {/* Right Column - Children (Login / Signup Forms enclosed in AuthCard) */}
      <div className="lg:col-span-7 flex flex-col justify-center bg-background py-6 lg:py-8 px-4 sm:px-6 lg:px-8 relative h-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex items-center justify-center"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
