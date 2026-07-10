import * as React from "react"
import { cn } from "@/lib/utils"

interface AuthFormContainerProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

export function AuthFormContainer({ children, className, ...props }: AuthFormContainerProps) {
  return (
    <form className={cn("space-y-3.5", className)} {...props}>
      {children}
    </form>
  )
}
