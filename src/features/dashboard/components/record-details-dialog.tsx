"use client"

import * as React from "react"
import { ModalWrapper } from "./modal-wrapper"
import { Button } from "@/components/ui/button"
import { ExpiryRecord } from "../types"
import { calculateExpiry } from "../utils/expiry-engine"
import { 
  Calendar, 
  DollarSign, 
  Tag, 
  FileText, 
  Mail, 
  Building2, 
  Clock, 
  ExternalLink,
  ShieldAlert
} from "lucide-react"
import { format, parseISO } from "date-fns"

interface RecordDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: ExpiryRecord | undefined
}

export function RecordDetailsDialog({
  open,
  onOpenChange,
  record
}: RecordDetailsDialogProps) {
  if (!record) return null

  const { remainingDays } = calculateExpiry(record.expiryDate, record.createdAt)

  const priorityBadges = {
    critical: "bg-red-500 text-white",
    high: "bg-amber-500/20 text-amber-600 dark:text-amber-500 border-amber-500/20",
    medium: "bg-blue-500/20 text-blue-600 dark:text-blue-500 border-blue-500/20",
    low: "bg-muted text-muted-foreground border-border"
  }

  const statusColors = {
    expired: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    expiring_soon: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    renewed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    archived: "bg-muted text-muted-foreground border-border"
  }

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      title="Contract Record Profile"
      description="Detailed registry information and audit logs."
      contentClassName="sm:max-w-[700px] md:max-w-[760px]"
    >
      <div className="space-y-4 text-left select-none">
        
        {/* Header Summary Banner */}
        <div className="rounded-xl border border-border bg-muted/10 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-[9px] font-extrabold text-primary uppercase tracking-wide">
              {record.category}
            </span>
            <h3 className="text-base font-extrabold text-foreground tracking-tight leading-tight">{record.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                <span>{record.department}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                <span>{record.owner}</span>
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border uppercase tracking-wider ${statusColors[record.status as keyof typeof statusColors] || statusColors.active}`}>
              {record.status}
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold border ${priorityBadges[record.priority as keyof typeof priorityBadges]}`}>
              {record.priority} priority
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Lifecycle, Financials */}
          <div className="space-y-4">
            
            {/* Expiry Countdown */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Lifecycle Schedule</h4>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Expiry Date</span>
                  </span>
                  <span className="font-extrabold text-foreground">{record.expiryDate}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Countdown</span>
                  </span>
                  <span className={`font-extrabold ${remainingDays < 0 ? "text-rose-500" : remainingDays <= 30 ? "text-amber-500" : "text-emerald-500"}`}>
                    {remainingDays === 0 ? "Expires Today" : remainingDays < 0 ? `Expired ${Math.abs(remainingDays)}d ago` : `In ${remainingDays} days`}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Financial Registry</h4>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Subscription Cost</span>
                  </span>
                  <span className="font-extrabold text-foreground">${record.cost}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Billing Cycle</span>
                  </span>
                  <span className="font-extrabold text-foreground capitalize">{record.renewalFrequency}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {record.description && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Description Details</h4>
                <p className="text-xs font-medium text-foreground leading-relaxed bg-muted/10 border border-border/60 rounded-lg p-3">
                  {record.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Vendors, Alerts, Tags */}
          <div className="space-y-4">
            
            {/* Vendor Profile */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Vendor Registry</h4>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Provider</span>
                  </span>
                  <span className="font-extrabold text-foreground">{record.vendor}</span>
                </div>
                {record.location && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span>Host Location</span>
                    </span>
                    <span className="font-extrabold text-foreground truncate max-w-[150px]">{record.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts Schedule */}
            {record.reminderDays && record.reminderDays.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Alert Schedule</h4>
                <div className="flex flex-wrap items-center gap-1 bg-muted/20 border border-border rounded-lg p-2.5">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground mr-1.5 shrink-0" />
                  {record.reminderDays.map((day) => (
                    <span key={day} className="text-[10px] font-extrabold bg-card border border-border rounded-md px-2 py-0.5">
                      {day}d before
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags list */}
            {record.tags && record.tags.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Internal Tags</h4>
                <div className="flex flex-wrap items-center gap-1">
                  {record.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded bg-muted border border-border px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                      <Tag className="h-2.5 w-2.5" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes & Attachments section */}
        <div className="grid grid-cols-1 gap-4 pt-1">
          {/* Notes */}
          {record.notes && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Internal Audit Notes</h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed bg-muted/30 border border-border rounded-lg p-3">
                {record.notes}
              </p>
            </div>
          )}

          {/* Attachments */}
          {record.attachments && record.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Linked Attachments & Documents</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {record.attachments.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border border-border hover:border-primary bg-background/50 hover:bg-primary/[0.02] rounded-lg p-2.5 text-xs font-bold text-muted-foreground hover:text-primary transition-all truncate"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1 pr-1">{url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Renewal History Timeline Audit Log */}
        {record.renewalHistory && record.renewalHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span>Renewal History & Audit Log</span>
            </h4>
            
            <div className="relative border-l border-border pl-4 space-y-4 ml-2">
              {record.renewalHistory.map((item, idx) => (
                <div key={idx} className="relative group text-xs text-left">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[21.5px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background flex items-center justify-center shrink-0" />
                  
                  {/* Card entry */}
                  <div className="space-y-1 bg-muted/20 border border-border/80 rounded-lg p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground">
                      <span>Renewed on {format(parseISO(item.renewedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                      <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded font-extrabold text-[9px] uppercase tracking-wide">
                        Cycle Extension
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-foreground font-bold">
                      <span>Expiry Extended:</span>
                      <span className="text-rose-500 line-through font-semibold text-[11px]">{item.previousExpiryDate}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-emerald-500 font-extrabold">{item.newExpiryDate}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground/90 pt-1 mt-1 border-t border-border/40">
                      <span>New Cycle Cost: ${item.cost}</span>
                      <span>By: {item.renewedBy}</span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] font-semibold text-muted-foreground/80 leading-normal pl-2 border-l-2 border-border mt-1.5 bg-background/30 py-1 pr-1 rounded">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs font-bold px-4 cursor-pointer"
          >
            Close Profile
          </Button>
        </div>

      </div>
    </ModalWrapper>
  )
}
