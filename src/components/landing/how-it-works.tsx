"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { PlusCircle, Cpu, LayoutDashboard, RotateCw } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      num: "1",
      icon: <PlusCircle className="h-6 w-6 text-primary" />,
      title: "Add Records",
      description: "Import licenses, domains, contracts or property leases in seconds manually or via API."
    },
    {
      num: "2",
      icon: <Cpu className="h-6 w-6 text-primary" />,
      title: "Automatic Expiry Detection",
      description: "Our tracking engine scans dates daily to calculate remaining days and alert thresholds."
    },
    {
      num: "3",
      icon: <LayoutDashboard className="h-6 w-6 text-primary" />,
      title: "Monitor Dashboard",
      description: "View warning status counts, active items, and critical alerts in real-time pipelines."
    },
    {
      num: "4",
      icon: <RotateCw className="h-6 w-6 text-primary" />,
      title: "Renew Before Expiry",
      description: "Get smart notifications to execute renewals, upload new versions, and maintain compliance."
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  } as const

  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  } as const

  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">How It Works</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Simple steps. Powerful impact.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Configure ExpiryIQ in minutes to establish robust tracking parameters for all your organization&apos;s dates.
          </p>
        </div>

        {/* Timeline container */}
        <div className="relative">
          {/* Timeline Connector Line (Desktop Horizontal) */}
          <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-border/80 -z-10" />

          {/* Timeline Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative z-10"
          >
            {steps.map((item, index) => (
              <motion.div
                key={index}
                variants={stepVariants}
                className="flex flex-col items-center text-center group"
              >
                {/* Step circle container */}
                <div className="relative mb-6">
                  {/* Outer circle layout */}
                  <div className="h-[90px] w-[90px] rounded-2xl border border-border bg-card/60 backdrop-blur-sm flex items-center justify-center group-hover:border-primary/20 dark:group-hover:border-primary/30 group-hover:scale-105 transition-all duration-300 shadow-sm relative">
                    {item.icon}
                  </div>
                  {/* Step number badge */}
                  <span className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border border-background shadow-sm">
                    {item.num}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium px-4">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
