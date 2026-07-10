import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({
  className,
  title,
  description,
  actions,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-6 border-b border-border/50 select-none",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
