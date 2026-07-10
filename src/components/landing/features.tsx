"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, Clock, LayoutDashboard, Search, RefreshCw, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export function Features() {
  const items = [
    {
      icon: <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      title: "Smart Record Management",
      description: "Organize all your critical contracts, property leases, and licenses. Securely upload verification files and centralize operations files.",
      gradient: "from-blue-500/10 to-indigo-500/5"
    },
    {
      icon: <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400" />,
      title: "Automatic Expiry Tracking",
      description: "Calculate and monitor remaining days for every document. ExpiryIQ scans dates daily to alert record owners automatically.",
      gradient: "from-amber-500/10 to-orange-500/5"
    },
    {
      icon: <LayoutDashboard className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />,
      title: "Visual Dashboards",
      description: "Get instant visibility into warning status logs, upcoming expirations pipeline, and category distribution counters in real time.",
      gradient: "from-emerald-500/10 to-teal-500/5"
    },
    {
      icon: <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      title: "Advanced Search & Filters",
      description: "Instantly retrieve key parameters across thousands of documents. Query by category, status, department, or date range.",
      gradient: "from-purple-500/10 to-pink-500/5"
    },
    {
      icon: <RefreshCw className="h-5 w-5 text-sky-500 dark:text-sky-400" />,
      title: "Renewal Workflows",
      description: "Streamline contract approvals, assign record owners, log renegotiation notes, and archive past agreement audit trails.",
      gradient: "from-sky-500/10 to-cyan-500/5"
    },
    {
      icon: <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />,
      title: "AI Business Assistant",
      description: "Ask questions, get summaries, and identify risks in agreements using our native natural language AI model integration.",
      gradient: "from-indigo-500/10 to-purple-500/5"
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  } as const

  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-1/2 left-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px] -z-10 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-left max-w-2xl mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything you need to simplify{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              renewal management
            </span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Powerful features built for modern operations teams. Centralize documents, automate notifications, and keep operations running cleanly.
          </p>
        </div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item, index) => (
            <motion.div key={index} variants={cardVariants}>
              <Card className="group h-full border border-border bg-card/50 hover:bg-card hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-default select-none shadow-none relative overflow-hidden hover:border-primary/20 dark:hover:border-primary/30">
                {/* Subtle Card Glow Background */}
                <div className={`absolute -top-12 -left-12 h-32 w-32 rounded-full bg-gradient-to-br ${item.gradient} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <CardHeader className="space-y-4 pb-3 relative z-10">
                  {/* Styled Icon */}
                  <div className="p-3 w-fit rounded-xl border border-border/80 bg-muted/40 dark:bg-muted/20 group-hover:border-primary/20 transition-colors duration-300">
                    {item.icon}
                  </div>
                  <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors duration-200">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
