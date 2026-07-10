"use client"

import * as React from "react"
import { Check, ShieldAlert, Zap, Clock } from "lucide-react"
import { useInView } from "framer-motion"

function StatCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = React.useState(0)
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  React.useEffect(() => {
    if (!isInView) return

    let start = 0
    const duration = 1200 // 1.2s animation
    const stepTime = Math.abs(Math.floor(duration / value))
    
    const timer = setInterval(() => {
      start += 1
      setCount(start)
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      }
    }, Math.max(stepTime, 16)) // Min 60fps frame rate limit

    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <span ref={ref} className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
      {count}
      {suffix}
    </span>
  )
}

export function Benefits() {
  const benefits = [
    "Prevent costly service outages from expired domains",
    "Reduce redundant software subscriptions and control spend",
    "Automate compliance audit logs and security files",
    "Define clear record ownership across departments",
    "Archive historical versions of leases and contracts",
    "Smart alerts before surprise critical milestones"
  ]

  const stats = [
    {
      icon: <ShieldAlert className="h-5 w-5 text-rose-500" />,
      number: 0,
      suffix: "%",
      label: "Surprise Expirations",
      description: "Zero outages since launch."
    },
    {
      icon: <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      number: 10,
      suffix: "x",
      label: "Audit Speedup",
      description: "Instant centralized retrieval."
    },
    {
      icon: <Zap className="h-5 w-5 text-emerald-500" />,
      number: 99,
      suffix: "%",
      label: "Alert Delivery Success",
      description: "Automated engine redundancy."
    }
  ]

  return (
    <section id="benefits" className="bg-muted/10 py-24 border-y border-border relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Details */}
          <div className="space-y-6 lg:col-span-6 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Key Benefits</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">
              Engineered for compliance and operational control
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed font-medium">
              Designed from the ground up to assist operations managers, IT leads, and finance officers in establishing robust oversight parameters.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-2.5">
                  <div className="p-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-500 shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground leading-tight">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Animated Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-6 w-full">
            {stats.map((stat, index) => (
              <Card key={index} className="border border-border bg-card/60 backdrop-blur-md shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300">
                <div className="p-2 w-fit rounded-lg border border-border bg-muted/40">
                  {stat.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline space-x-0.5">
                    <StatCounter value={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {stat.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-normal font-semibold">
                    {stat.description}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Minimal Card wrapper to prevent imports complexity
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border ${className}`}>
      {children}
    </div>
  )
}
