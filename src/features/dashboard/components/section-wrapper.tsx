import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function SectionWrapper({
  children,
  className,
  title,
  description,
  actions,
  ...props
}: SectionWrapperProps) {
  return (
    <section className={cn("space-y-4", className)} {...props}>
      {(title || description || actions) && (
        <div className="flex flex-row items-center justify-between pb-1">
          <div className="space-y-0.5">
            {title && <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>}
            {description && <p className="text-xs font-semibold text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </section>
  )
}
