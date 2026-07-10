"use client"

import * as React from "react"
import { ModalWrapper } from "./modal-wrapper"
import { Button } from "@/components/ui/button"
import { ExpiryRecord } from "../types"
import { RecordsService } from "../services/records-service"
import { RefreshCw, Calendar, DollarSign, Info } from "lucide-react"
import { addMonths, addYears, parseISO, format } from "date-fns"
import toast from "react-hot-toast"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { NotificationsService } from "../services/notifications-service"
import { ActivityService } from "../services/activity-service"

interface RenewRecordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: ExpiryRecord | undefined
  onRenewalCompleted?: () => void
}

export function RenewRecordDialog({
  open,
  onOpenChange,
  record,
  onRenewalCompleted
}: RenewRecordDialogProps) {
  const { user } = useAuth()
  const [newExpiryDate, setNewExpiryDate] = React.useState("")
  const [newCost, setNewCost] = React.useState<number>(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [renewalNotes, setRenewalNotes] = React.useState("")

  // Compute recommended renewal date based on frequency cycle
  React.useEffect(() => {
    if (open && record) {
      const timer = setTimeout(() => {
        setNewCost(record.cost)
        try {
          const currentExpiry = parseISO(record.expiryDate)
          let recommended: Date
          
          switch (record.renewalFrequency) {
            case "monthly":
              recommended = addMonths(currentExpiry, 1)
              break
            case "quarterly":
              recommended = addMonths(currentExpiry, 3)
              break
            case "annually":
              recommended = addYears(currentExpiry, 1)
              break
            default:
              recommended = addYears(currentExpiry, 1)
              break
          }
          
          setNewExpiryDate(format(recommended, "yyyy-MM-dd"))
        } catch {
          setNewExpiryDate(record.expiryDate)
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open, record])

  if (!record) return null

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpiryDate) {
      toast.error("Please select a valid expiry date")
      return
    }

    setIsSubmitting(true)
    try {
      await RecordsService.renewRecord(record.id!, user?.uid || "mock-user", {
        previousExpiryDate: record.expiryDate,
        newExpiryDate: newExpiryDate,
        cost: newCost,
        notes: renewalNotes
      })
      
      // Trigger live notification
      await NotificationsService.createNotification(record.userId || user?.uid || "mock-user", {
        title: "Successfully Renewed",
        description: `"${record.title}" cycle was successfully extended to ${newExpiryDate}.`,
        type: "renewed",
        category: "success"
      })

      // Log activity
      await ActivityService.logActivity(user?.uid || "mock-user", {
        name: user?.displayName || "Admin",
        email: user?.email || "admin@expiry-iq.com",
        avatarUrl: user?.photoURL || ""
      }, {
        action: "renew",
        recordId: record.id!,
        recordTitle: record.title,
        message: `renewed contract cycle for "${record.title}" (extended to ${newExpiryDate})`
      })

      toast.success("Expiry cycle renewed successfully!")
      setRenewalNotes("")
      if (onRenewalCompleted) onRenewalCompleted()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to renew record. Please retry.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      title="Renew Expiry Cycle"
      description="Extend billing schedule and log new renewal timestamps."
      contentClassName="sm:max-w-[420px]"
    >
      <form onSubmit={handleRenewSubmit} className="space-y-4 text-left select-none">
        
        {/* Info panel displaying current state */}
        <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-1.5 text-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Contract Details</p>
          <div className="flex justify-between font-bold">
            <span className="text-foreground">{record.title}</span>
            <span className="text-muted-foreground capitalize">{record.renewalFrequency}</span>
          </div>
          <div className="flex justify-between font-semibold text-muted-foreground border-t border-border/50 pt-1.5 mt-1.5">
            <span>Previous Expiry:</span>
            <span>{record.expiryDate}</span>
          </div>
        </div>

        {/* New Expiry Date select input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Next Expiry Date</span>
          </label>
          <input
            type="date"
            value={newExpiryDate}
            onChange={(e) => setNewExpiryDate(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-all font-sans"
            required
          />
          <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 opacity-90 pl-0.5">
            <Info className="h-3 w-3 text-primary shrink-0" />
            <span>Suggested automatically based on {record.renewalFrequency} cycle.</span>
          </p>
        </div>

        {/* Cost adjustments input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Renewal Cost ($)</span>
          </label>
          <input
            type="number"
            step="any"
            value={newCost}
            onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-all"
            required
          />
        </div>

        {/* Optional Renewal Notes */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Renewal Notes (Optional)
          </label>
          <textarea
            placeholder="Log renewal details, invoice references, or pricing terms..."
            value={renewalNotes}
            onChange={(e) => setRenewalNotes(e.target.value)}
            className="w-full h-16 p-2 text-xs font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-all resize-none"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs font-bold px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 text-xs font-bold px-4 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent cursor-pointer min-w-[100px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                <span>Renewing...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Confirm Renewal</span>
              </span>
            )}
          </Button>
        </div>

      </form>
    </ModalWrapper>
  )
}
