import * as React from "react"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { ROUTES } from "@/constants"

interface AuthHeaderProps {
  title: string
  subtitle: string
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-2.5">
      {/* Brand Icon Link */}
      <Link
        href={ROUTES.HOME}
        className="flex items-center justify-center p-2 rounded-xl bg-primary/10 border border-primary/20 dark:bg-primary/20 dark:border-primary/30 group-hover:scale-105 transition-transform"
        aria-label="Back to home"
      >
        <ShieldAlert className="h-6 w-6 text-primary" />
      </Link>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground font-medium leading-normal">{subtitle}</p>
      </div>
    </div>
  )
}
