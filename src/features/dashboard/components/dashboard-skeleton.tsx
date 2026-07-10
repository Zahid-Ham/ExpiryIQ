import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "card" | "table" | "stat" | "header"
}

export function DashboardSkeleton({ className, variant = "card", ...props }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse w-full", className)} {...props}>
      {variant === "stat" && (
        <div className="border border-border/60 bg-card/45 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded-lg" />
          </div>
          <div className="h-8 w-28 bg-muted rounded" />
          <div className="h-3.5 w-16 bg-muted rounded" />
        </div>
      )}

      {variant === "card" && (
        <div className="border border-border/60 bg-card/45 rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-4.5 w-40 bg-muted rounded" />
            <div className="h-3 w-64 bg-muted rounded" />
          </div>
          <div className="h-32 w-full bg-muted/65 rounded-lg" />
        </div>
      )}

      {variant === "header" && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/50">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted rounded" />
            <div className="h-4 w-72 bg-muted rounded" />
          </div>
          <div className="h-9 w-28 bg-muted rounded-lg" />
        </div>
      )}

      {variant === "table" && (
        <div className="border border-border/60 bg-card/45 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/50 flex justify-between">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-8 w-24 bg-muted rounded-lg" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                <div className="space-y-1">
                  <div className="h-4 w-36 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
                <div className="h-4.5 w-24 bg-muted rounded" />
                <div className="h-6 w-16 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
