"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, FolderKanban, Users, Clock, Edit3 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function FAQ() {
  const faqs = [
    {
      q: "How are records classified?",
      a: "Records are organized by standard enterprise categories such as Software Licenses, Domain Names, Subscriptions, Office Leases, Insurance Contracts, and Certifications. You can assign custom priorities, values, and individual record owners to each item.",
      icon: <FolderKanban className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
    },
    {
      q: "Can teams collaborate?",
      a: "Yes. ExpiryIQ is built for teams. You can invite collaborators, assign specific records to department managers, and view automated change logs to track which administrator executed contract updates.",
      icon: <Users className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400" />
    },
    {
      q: "How does expiry tracking work?",
      a: "The tracking engine runs background checks daily against the active database. When a record crosses your warning threshold (default 30 days) or critical threshold (default 7 days), it updates the dashboard pipeline and fires notifications automatically.",
      icon: <Clock className="h-4.5 w-4.5 text-amber-500" />
    },
    {
      q: "Can reminders be added later?",
      a: "Yes. You can edit existing records at any point to update target dates, change owner assignments, attach revised agreements, or adjust threshold alert days.",
      icon: <Edit3 className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
    }
  ]

  const [openIndex, setOpenIndex] = React.useState<number | null>(null)

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Support FAQ</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-muted-foreground">
            Everything you need to know about setting up and managing record expirations.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="border border-border rounded-xl bg-card/60 backdrop-blur-md overflow-hidden hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-foreground hover:bg-muted/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg border border-border bg-muted/40">
                      {faq.icon}
                    </div>
                    <span>{faq.q}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4.5 w-4.5 text-muted-foreground shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-4.5 w-4.5 text-muted-foreground shrink-0 ml-4" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-2 border-t border-border bg-muted/10 text-xs text-muted-foreground leading-relaxed pl-[52px]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
