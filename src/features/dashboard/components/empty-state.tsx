import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

export function EmptyState({
  className,
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-border/80 bg-card/25 rounded-xl min-h-[320px] backdrop-blur-sm select-none",
        className
      )}
      {...props}
    >
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 animate-pulse">
        {Icon ? (
          <Icon className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6 rotate-45" />
        )}
      </div>

      <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs font-medium text-muted-foreground max-w-[320px] leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 h-9 text-xs font-bold gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{actionLabel}</span>
        </Button>
      )}
    </div>
  )
}
