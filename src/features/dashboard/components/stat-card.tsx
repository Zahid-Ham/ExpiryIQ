import * as React from "react"
import { cn } from "@/lib/utils"
import { DashboardCard } from "./dashboard-card"
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  change?: string | number
  changeType?: "increase" | "decrease" | "neutral"
  timeframe?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  timeframe,
  icon: Icon,
  className
}: StatCardProps) {
  return (
    <DashboardCard className={cn("overflow-hidden relative", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-foreground">{value}</span>
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold",
              changeType === "increase" && "bg-emerald-500/10 text-emerald-500",
              changeType === "decrease" && "bg-rose-500/10 text-rose-500",
              changeType === "neutral" && "bg-muted text-muted-foreground"
            )}
          >
            {changeType === "increase" && <ArrowUpRight className="h-3 w-3" />}
            {changeType === "decrease" && <ArrowDownRight className="h-3 w-3" />}
            {changeType === "neutral" && <TrendingUp className="h-3 w-3" />}
            <span>{change}</span>
          </span>
        )}
      </div>

      {timeframe && (
        <p className="mt-1 text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">{timeframe}</p>
      )}

      {/* Decorative subtle top bar indicator */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/30 via-primary/10 to-transparent pointer-events-none" />
    </DashboardCard>
  )
}
