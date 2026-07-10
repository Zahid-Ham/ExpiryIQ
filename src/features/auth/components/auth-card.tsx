import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function AuthCard({ children, className, ...props }: AuthCardProps) {
  return (
    <Card
      className={cn(
        "w-full max-w-[460px] border border-border bg-card/60 backdrop-blur-md shadow-lg overflow-hidden",
        className
      )}
      {...props}
    >
      <CardContent className="p-6 sm:p-8 space-y-3.5">
        {children}
      </CardContent>
    </Card>
  )
}
