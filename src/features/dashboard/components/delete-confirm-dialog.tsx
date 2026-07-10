"use client"

import * as React from "react"
import { ModalWrapper } from "./modal-wrapper"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordTitle: string
  recordDetail?: string
  isDeleting?: boolean
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  recordTitle,
  recordDetail,
  isDeleting = false,
  onConfirm
}: DeleteConfirmDialogProps) {
  
  // Intercept keyboard Enter to trigger confirmation when dialog is open
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === "Enter" && !isDeleting) {
        e.preventDefault()
        onConfirm()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, isDeleting, onConfirm])

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm Deletion"
      description="This action is permanent and cannot be undone."
      contentClassName="sm:max-w-[420px]"
    >
      <div className="space-y-4 pt-1 pb-2 select-none text-left">
        
        {/* Warning Alert Banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold uppercase tracking-wider">Warning</h4>
            <p className="text-[11px] font-semibold leading-normal opacity-90">
              Deleting this record will stop active alert monitoring and remove all notification schedules.
            </p>
          </div>
        </div>

        {/* Record details details summary */}
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Target Record</p>
          <div className="space-y-0.5">
            <p className="font-bold text-foreground text-sm truncate">{recordTitle}</p>
            {recordDetail && (
              <p className="text-[11px] font-semibold text-muted-foreground truncate">{recordDetail}</p>
            )}
          </div>
        </div>

        <p className="text-xs font-semibold text-muted-foreground leading-normal">
          Are you sure you want to delete this record? Please confirm to proceed.
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs font-bold px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="h-9 text-xs font-bold px-4 bg-rose-500 hover:bg-rose-600 text-white border-transparent cursor-pointer min-w-[90px]"
          >
            {isDeleting ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                <span>Deleting...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </span>
            )}
          </Button>
        </div>

      </div>
    </ModalWrapper>
  )
}
