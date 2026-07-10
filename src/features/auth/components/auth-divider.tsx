import * as React from "react"

export function AuthDivider() {
  return (
    <div className="relative flex py-2 items-center">
      <div className="flex-grow border-t border-border/80"></div>
      <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
        Or continue with
      </span>
      <div className="flex-grow border-t border-border/80"></div>
    </div>
  )
}
