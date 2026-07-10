import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface ModalWrapperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footerActions?: React.ReactNode
  contentClassName?: string
}

export function ModalWrapper({
  open,
  onOpenChange,
  title,
  description,
  children,
  footerActions,
  contentClassName
}: ModalWrapperProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`border border-border bg-card/95 backdrop-blur-md shadow-lg overflow-hidden ${contentClassName || "sm:max-w-[480px]"}`}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs font-semibold text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4 text-sm text-foreground">
          {children}
        </div>
        {footerActions && (
          <DialogFooter className="flex items-center gap-2 border-t border-border/50 pt-4 mt-2">
            {footerActions}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
