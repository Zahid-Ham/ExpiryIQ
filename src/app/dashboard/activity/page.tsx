"use client"

import * as React from "react"
import { DashboardLayout } from "@/features/dashboard/layouts/dashboard-layout"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { 
  ActivityService, 
  ActivityItem 
} from "@/features/dashboard/services/activity-service"
import { 
  PlusCircle, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  BellRing, 
  AlertCircle,
  Inbox,
  Clock,
  Filter
} from "lucide-react"
import { format, parseISO, formatDistanceToNow } from "date-fns"

export default function ActivityTimelinePage() {
  const { user } = useAuth()
  const [activities, setActivities] = React.useState<ActivityItem[]>([])
  const [filterAction, setFilterAction] = React.useState<string>("all")
  const [isLoading, setIsLoading] = React.useState(true)

  // Subscribe to real-time activities from Firestore
  React.useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = ActivityService.subscribeActivity(
      user.uid,
      (data) => {
        setActivities(data)
        setIsLoading(false)
      },
      (err) => {
        console.error("Firestore activities subscription error:", err)
        setIsLoading(false)
      }
    )
    return () => unsubscribe()
  }, [user?.uid])

  // Filter activities lists
  const filteredActivities = React.useMemo(() => {
    if (filterAction === "all") return activities
    return activities.filter((act) => act.action === filterAction)
  }, [activities, filterAction])

  // Render dynamic action badge details
  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return { 
          bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", 
          icon: PlusCircle,
          label: "Created" 
        }
      case "update":
        return { 
          bg: "bg-blue-500/10 text-blue-500 border-blue-500/20", 
          icon: Edit3,
          label: "Modified" 
        }
      case "delete":
        return { 
          bg: "bg-rose-500/10 text-rose-500 border-rose-500/20", 
          icon: Trash2,
          label: "Deleted" 
        }
      case "renew":
        return { 
          bg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", 
          icon: RefreshCw,
          label: "Renewed" 
        }
      case "reminder_sent":
        return { 
          bg: "bg-amber-500/10 text-amber-500 border-amber-500/20", 
          icon: BellRing,
          label: "Alert Sent" 
        }
      default:
        return { 
          bg: "bg-muted text-muted-foreground border-border", 
          icon: AlertCircle,
          label: "Activity" 
        }
    }
  }

  // Helper for user initial avatar bubble
  const renderUserAvatar = (item: ActivityItem) => {
    if (item.userAvatar) {
      return (
        <img 
          src={item.userAvatar} 
          alt={item.userName} 
          className="h-9 w-9 rounded-full border border-border shrink-0 object-cover"
        />
      )
    }
    const initial = item.userName ? item.userName.charAt(0).toUpperCase() : "A"
    return (
      <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
        {initial}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Activity Log & Audit Trail"
        description="Monitor system interactions, renewals, creations, and deletion events in real-time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none text-left">
        
        {/* Actions Filter sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest px-1 pb-1 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter Audit Events</span>
            </p>
            
            <div className="flex flex-col gap-1">
              {[
                { val: "all", label: "All Audit Trail", count: activities.length },
                { val: "create", label: "Creations Only", count: activities.filter(a => a.action === "create").length },
                { val: "update", label: "Edits & Updates", count: activities.filter(a => a.action === "update").length },
                { val: "renew", label: "Cycle Renewals", count: activities.filter(a => a.action === "renew").length },
                { val: "delete", label: "Deletions Log", count: activities.filter(a => a.action === "delete").length }
              ].map((filterOption) => (
                <button
                  key={filterOption.val}
                  onClick={() => setFilterAction(filterOption.val)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    filterAction === filterOption.val 
                      ? "bg-primary/10 text-primary font-extrabold" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <span>{filterOption.label}</span>
                  <span className="bg-muted px-1.5 py-0.5 rounded border border-border/80 text-[10px] text-muted-foreground font-extrabold">
                    {filterOption.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chronological Timeline feed panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px] flex flex-col">
            
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : filteredActivities.length > 0 ? (
              <div className="relative border-l border-border pl-6 space-y-6 ml-3 py-1.5">
                {filteredActivities.map((act) => {
                  const badge = getActionBadge(act.action)
                  const ActionIcon = badge.icon
                  let relativeTime = ""
                  
                  try {
                    relativeTime = formatDistanceToNow(parseISO(act.createdAt), { addSuffix: true })
                  } catch {
                    relativeTime = "recent"
                  }

                  return (
                    <div key={act.id} className="relative group text-xs text-left">
                      
                      {/* Left timeline connecting connector circle */}
                      <div className="absolute -left-[32px] top-1.5 h-4.5 w-4.5 rounded-full border border-border bg-card shadow-sm flex items-center justify-center text-muted-foreground group-hover:border-primary transition-all">
                        <ActionIcon className="h-2.5 w-2.5 text-muted-foreground/95" />
                      </div>

                      {/* Content panel */}
                      <div className="bg-muted/15 border border-border/70 rounded-xl p-4 space-y-2 hover:bg-muted/25 transition-all">
                        
                        {/* Header details */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            {renderUserAvatar(act)}
                            <div>
                              <p className="font-extrabold text-foreground leading-none">{act.userName}</p>
                              <span className="text-[10px] text-muted-foreground font-bold">{act.userEmail}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{relativeTime}</span>
                            </span>
                          </div>
                        </div>

                        {/* Action description text */}
                        <p className="text-xs sm:text-[13px] font-semibold text-foreground/90 pl-1">
                          <span className="font-extrabold text-primary">{act.userName}</span> {act.message}
                        </p>

                        {/* Timestamp detail footer */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground pl-1 border-t border-border/40 pt-2 mt-1">
                          <span>Ref ID: {act.recordId}</span>
                          <span>{format(parseISO(act.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                        </div>

                      </div>

                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <Inbox className="h-10 w-10 text-muted-foreground/50 mb-3 animate-bounce" />
                <h4 className="text-sm font-bold text-foreground mb-1">No Activity Logs</h4>
                <p className="text-xs text-muted-foreground/80 leading-normal font-semibold">
                  No system trail records found matching your selected filters.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
