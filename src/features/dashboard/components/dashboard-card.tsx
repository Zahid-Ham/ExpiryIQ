import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  headerActions?: React.ReactNode
}

export function DashboardCard({
  children,
  className,
  title,
  description,
  footer,
  headerActions,
  ...props
}: DashboardCardProps) {
  const hasHeader = title || description || headerActions

  return (
    <Card className={cn("border border-border/80 bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md", className)} {...props}>
      {hasHeader && (
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="space-y-1">
            {title && <CardTitle className="text-base font-bold tracking-tight text-foreground">{title}</CardTitle>}
            {description && <CardDescription className="text-xs font-semibold text-muted-foreground">{description}</CardDescription>}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </CardHeader>
      )}
      <CardContent className={cn("pt-0", !hasHeader && "pt-6")}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="border-t border-border/50 pt-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
