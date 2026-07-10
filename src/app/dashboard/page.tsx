"use client"

import * as React from "react"
import { DashboardLayout } from "@/features/dashboard/layouts/dashboard-layout"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { StatCard } from "@/features/dashboard/components/stat-card"
import { DashboardCard } from "@/features/dashboard/components/dashboard-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { RecordsService } from "@/features/dashboard/services/records-service"
import { ActivityService, ActivityItem } from "@/features/dashboard/services/activity-service"
import { calculateExpiry } from "@/features/dashboard/utils/expiry-engine"
import { ExpiryRecord } from "@/features/dashboard/schemas"
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Download,
  BrainCircuit,
  ArrowUp,
  ArrowDown,
  Activity,
  Layers,
  Building2,
  Clock,
  Layout,
  Settings,
  Link as LinkIcon
} from "lucide-react"
import toast from "react-hot-toast"
import { addMonths, format, parseISO, formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firestore"
import { FIRESTORE_COLLECTIONS } from "@/constants"
import { DailyBrief } from "@/features/dashboard/components/daily-brief"
import { AIInsightsSection } from "@/features/dashboard/components/ai-insights-section"

const DEFAULT_WIDGETS = [
  "OVERDUE",
  "TODAY",
  "UPCOMING",
  "QUICK_ACTIONS",
  "DEPARTMENTS",
  "RECENT_UPLOADS",
  "RISK_CATEGORIES",
  "ACTIVITY"
]

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [records, setRecords] = React.useState<ExpiryRecord[]>([])
  const [activities, setActivities] = React.useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  // Widget ordering and customize states
  const [widgetOrder, setWidgetOrder] = React.useState<string[]>(DEFAULT_WIDGETS)
  const [isEditingLayout, setIsEditingLayout] = React.useState(false)

  // Load layout preferences
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("expiry_iq_widget_layout")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWidgetOrder(parsed)
          }
        } catch {
          // Fallback to default
        }
      }
    }
  }, [])

  // Subscribe to real-time records changes in database
  React.useEffect(() => {
    if (!user?.uid) return

    const unsubscribe = RecordsService.subscribeUserRecords(
      user.uid,
      (data) => {
        setRecords(data)
        setIsLoading(false)
      },
      (err) => {
        console.error("Firestore dashboard records subscription error:", err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  // Subscribe to live activity feed log
  React.useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = ActivityService.subscribeActivity(
      user.uid,
      (data) => setActivities(data.slice(0, 5)),
      (err) => console.error("Error loading dashboard activity stream:", err)
    )
    return () => unsubscribe()
  }, [user?.uid])

  // 1. Metric Calculations
  const totalCount = records.length
  const criticalCount = records.filter(r => r.status === "expired" || r.status === "expiring_soon").length
  
  // Calculate monthly cost spend
  const monthlyCostValue = records.reduce((acc, curr) => {
    const costNum = curr.cost || 0
    if (curr.renewalFrequency === "monthly") {
      return acc + costNum
    }
    if (curr.renewalFrequency === "quarterly") {
      return acc + (costNum / 3)
    }
    if (curr.renewalFrequency === "annually") {
      return acc + (costNum / 12)
    }
    return acc
  }, 0)

  // Auto-renewing records count
  const autoRenewCount = records.filter(r => r.renewalFrequency !== "one-time").length

  const stats = [
    { 
      title: "Total Expiries", 
      value: isLoading ? "..." : String(totalCount), 
      change: "Active contracts tracked", 
      changeType: "increase" as const, 
      icon: FileText 
    },
    { 
      title: "Critical & Warning", 
      value: isLoading ? "..." : String(criticalCount), 
      change: "Action recommended", 
      changeType: "decrease" as const, 
      icon: AlertTriangle 
    },
    { 
      title: "Recurring Schedule", 
      value: isLoading ? "..." : String(autoRenewCount), 
      change: totalCount > 0 ? `${Math.round((autoRenewCount / totalCount) * 100)}% of total` : "0% of total", 
      changeType: "increase" as const, 
      icon: CheckCircle2 
    },
    { 
      title: "Est. Monthly Spend", 
      value: isLoading ? "..." : `$${Math.round(monthlyCostValue).toLocaleString()}`, 
      change: "Prorated normalization", 
      changeType: "neutral" as const, 
      icon: TrendingUp 
    }
  ]

  // Widget: Overdue Items
  const overdueItems = React.useMemo(() => {
    return records.filter(r => {
      const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
      return remainingDays < 0
    }).slice(0, 5)
  }, [records])

  // Widget: Today's Expiries
  const todaysExpiries = React.useMemo(() => {
    return records.filter(r => {
      const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
      return remainingDays === 0
    }).slice(0, 5)
  }, [records])

  // Widget: Upcoming Renewals
  const upcomingRenewals = React.useMemo(() => {
    return [...records]
      .filter(r => {
        const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
        return remainingDays > 0
      })
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
      .slice(0, 5)
  }, [records])

  // Widget: Most Active Departments
  const activeDepartments = React.useMemo(() => {
    const counts: Record<string, number> = {}
    records.forEach(r => {
      if (r.department) {
        counts[r.department] = (counts[r.department] || 0) + 1
      }
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [records])

  // Widget: Recent Uploaded Documents (secure uploads metadata)
  const recentUploads = React.useMemo(() => {
    const docs: Array<{ name: string; recordId: string; recordTitle: string; size: number; uploadDate: string }> = []
    records.forEach(r => {
      if (r.documents) {
        r.documents.forEach(d => {
          docs.push({
            name: d.name,
            recordId: r.id || "",
            recordTitle: r.title,
            size: d.size,
            uploadDate: d.uploadDate
          })
        })
      }
    })
    return docs.sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)).slice(0, 5)
  }, [records])

  // Widget: Highest Risk Categories
  const highestRiskCategories = React.useMemo(() => {
    const stats: Record<string, { total: number; critical: number }> = {}
    records.forEach(r => {
      if (!stats[r.category]) {
        stats[r.category] = { total: 0, critical: 0 }
      }
      stats[r.category].total += 1
      if (r.status === "expired" || r.status === "expiring_soon") {
        stats[r.category].critical += 1
      }
    })
    return Object.entries(stats)
      .map(([name, val]) => ({
        name,
        percentage: val.total > 0 ? Math.round((val.critical / val.total) * 100) : 0,
        critical: val.critical,
        total: val.total
      }))
      .sort((a, b) => b.percentage - a.percentage || b.critical - a.critical)
      .slice(0, 5)
  }, [records])

  // Widget Layout Shifts Actions
  const moveWidget = (index: number, direction: "up" | "down") => {
    const newOrder = [...widgetOrder]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newOrder.length) return
    
    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIndex]
    newOrder[targetIndex] = temp
    
    setWidgetOrder(newOrder)
    localStorage.setItem("expiry_iq_widget_layout", JSON.stringify(newOrder))
  }

  const resetLayout = () => {
    setWidgetOrder(DEFAULT_WIDGETS)
    localStorage.removeItem("expiry_iq_widget_layout")
    toast.success("Dashboard grid layout reset to default")
  }

  // format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  // Render Widget Card header with customize layout buttons
  const renderWidgetHeader = (id: string, index: number, title: string, description: string) => {
    return (
      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3 select-none">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{title}</h4>
          <p className="text-[10px] font-semibold text-muted-foreground pl-0.5">{description}</p>
        </div>
        {isEditingLayout && (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => moveWidget(index, "up")}
              disabled={index === 0}
              className="p-1 rounded border border-border/80 hover:bg-muted text-muted-foreground disabled:opacity-40 cursor-pointer"
              title="Move Up"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button 
              onClick={() => moveWidget(index, "down")}
              disabled={index === widgetOrder.length - 1}
              className="p-1 rounded border border-border/80 hover:bg-muted text-muted-foreground disabled:opacity-40 cursor-pointer"
              title="Move Down"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Widget Rendering Engine
  const renderWidget = (id: string, index: number) => {
    switch (id) {
      case "OVERDUE":
        return (
          <div key={id} className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col text-left">
            {renderWidgetHeader(id, index, "Overdue Contracts", "Contracts that have already expired")}
            <div className="space-y-2 flex-1">
              {overdueItems.length > 0 ? (
                overdueItems.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => router.push(`/dashboard/records/${item.id}`)}
                    className="flex justify-between items-center p-2 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{item.title}</p>
                      <span className="text-[9px] font-bold text-rose-500/80">{item.expiryDate} (Overdue)</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-foreground">${item.cost}</span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground/80 font-bold">No overdue contracts found.</div>
              )}
            </div>
          </div>
        )

      case "TODAY":
        return (
          <div key={id} className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col text-left">
            {renderWidgetHeader(id, index, "Expires Today", "Contracts expiring on the current calendar date")}
            <div className="space-y-2 flex-1">
              {todaysExpiries.length > 0 ? (
                todaysExpiries.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => router.push(`/dashboard/records/${item.id}`)}
                    className="flex justify-between items-center p-2 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{item.title}</p>
                      <span className="text-[9px] font-bold text-amber-600">Expires Today</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-foreground">${item.cost}</span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground/80 font-bold">No items expiring today.</div>
              )}
            </div>
          </div>
        )

      case "UPCOMING":
        return (
          <div key={id} className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col text-left col-span-1 md:col-span-2">
            {renderWidgetHeader(id, index, "Upcoming Renewals Timeline", "Upcoming contract deadlines sorted chronologically")}
            <div className="space-y-2 flex-1">
              {upcomingRenewals.length > 0 ? (
                upcomingRenewals.map((item) => {
                  const remaining = calculateExpiry(item.expiryDate, item.createdAt).remainingDays
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => router.push(`/dashboard/records/${item.id}`)}
                      className="flex justify-between items-center p-2.5 rounded-lg border border-border bg-background hover:bg-muted/10 cursor-pointer transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{item.title}</p>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/80">
                          <span>{item.expiryDate}</span>
                          <span>•</span>
                          <span className={remaining <= 7 ? "text-rose-500" : remaining <= 30 ? "text-amber-500" : "text-emerald-500"}>
                            {remaining} days left
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-foreground">${item.cost}</span>
                    </div>
                  )
                })
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground/80 font-bold">No upcoming expirations found.</div>
              )}
            </div>
          </div>
        )

      case "QUICK_ACTIONS":
        return (
          <div key={id} className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col text-left">
            {renderWidgetHeader(id, index, "Quick Actions Shortcuts", "Jump to pages or audit tools")}
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[
                { label: "New Contract", path: "/dashboard/records", icon: Plus },
                { label: "Alerts Center", path: "/dashboard/notifications", icon: FileText },
                { label: "Calendar view", path: "/dashboard/calendar", icon: Calendar },
                { label: "Activity Logs", path: "/dashboard/activity", icon: Activity }
              ].map((act, idx) => {
                const Icon = act.icon
                return (
                  <button
                    key={idx}
                    onClick={() => router.push(act.path)}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all text-center gap-1.5 cursor-pointer"
                  >
                    <Icon className="h-4.5 w-4.5 text-primary shrink-0" />
                    <span className="text-[10px] font-extrabold text-foreground">{act.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case "DEPARTMENTS":
        return (
          <div key={id} className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col text-left">
            {renderWidgetHeader(id, index, "Active Departments", "Distribution of contract profiles across teams")}
            <div className="space-y-2 flex-1">
              {activeDepartments.length > 0 ? (
                activeDepartments.map((dept, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-muted/10 border border-border/60">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{dept.name}</span>
                    </span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-extrabold border border-primary/20">
                      {dept.count} Records
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground/80 font-bold">No department data.</div>
              )}
            </div>
          </div>
        )

      case "RECENT_UPLOADS":
        return (
          <div key={id} className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col text-left col-span-1 md:col-span-2">
            {renderWidgetHeader(id, index, "Recent Document Uploads", "Secure contract attachments uploaded to Firebase Storage")}
            <div className="space-y-2 flex-1">
              {recentUploads.length > 0 ? (
                recentUploads.map((doc, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => router.push(`/dashboard/records/${doc.recordId}`)}
                    className="flex justify-between items-center p-2.5 rounded-lg border border-border bg-background hover:bg-muted/10 cursor-pointer transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate max-w-[220px]">{doc.name}</p>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/80">
                        <span>Size: {formatBytes(doc.size)}</span>
                        <span>•</span>
                        <span>On: {doc.recordTitle}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground">{format(parseISO(doc.uploadDate), "MMM d")}</span>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground/80 font-bold">No documents uploaded.</div>
              )}
            </div>
          </div>
        )

      case "RISK_CATEGORIES":
        return (
          <div key={id} className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col text-left">
            {renderWidgetHeader(id, index, "Highest Risk Categories", "Sectors with highest ratio of warnings")}
            <div className="space-y-2 flex-1">
              {highestRiskCategories.length > 0 ? (
                highestRiskCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1 p-2 rounded-lg bg-muted/15 border border-border/80">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-foreground capitalize">{cat.name}</span>
                      <span className="text-rose-500">{cat.percentage}% Risk</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        style={{ width: `${cat.percentage}%` }} 
                        className={`h-full ${cat.percentage > 50 ? "bg-rose-500" : "bg-amber-500"}`}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-muted-foreground/85">
                      <span>{cat.critical} warnings</span>
                      <span>{cat.total} total</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground/80 font-bold">No categories mapped.</div>
              )}
            </div>
          </div>
        )

      case "ACTIVITY":
        return (
          <div key={id} className="bg-card border border-border rounded-xl p-4.5 shadow-xs flex flex-col text-left col-span-1 md:col-span-2">
            {renderWidgetHeader(id, index, "Workspace Activity Feed", "Live audit logs synchronized with Firestore")}
            <div className="space-y-3.5 flex-1 pt-1.5">
              {activities.length > 0 ? (
                activities.map((act) => {
                  let timeText = ""
                  try {
                    timeText = formatDistanceToNow(parseISO(act.createdAt), { addSuffix: true })
                  } catch {
                    timeText = "recent"
                  }
                  
                  return (
                    <div key={act.id} className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold flex items-center justify-center shrink-0 uppercase">
                        {act.userName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-semibold text-foreground/90 leading-tight">
                          <strong className="font-extrabold text-foreground">{act.userName}</strong> {act.message}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{timeText}</span>
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground/80 font-bold">No recent activities.</div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      
      {/* Header Panel */}
      <PageHeader
        title={`Dashboard`}
        description={`Welcome back, ${user?.displayName?.split(" ")[0] || "there"}! Let's review upcoming renewals, secure uploads, and audit trails.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditingLayout(prev => !prev)}
              className={`h-10 text-sm font-bold gap-1.5 cursor-pointer ${
                isEditingLayout ? "bg-primary/10 text-primary border-primary/30" : ""
              }`}
            >
              <Layout className="h-4 w-4" />
              <span>{isEditingLayout ? "Lock grid" : "Rearrange"}</span>
            </Button>
            
            {isEditingLayout && (
              <Button
                variant="ghost"
                onClick={resetLayout}
                className="h-10 text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 cursor-pointer"
              >
                Reset Layout
              </Button>
            )}

            <Button 
              onClick={() => router.push("/dashboard/records")}
              className="h-10 text-sm font-bold gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Manage Records</span>
            </Button>
          </div>
        }
      />

      {/* Daily AI Compliance Brief Banner */}
      <div className="mb-6 space-y-6">
        <DailyBrief records={records} />
        <AIInsightsSection records={records} />
      </div>

      {/* Stats Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Customizable Grid Dashboard widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgetOrder.map((id, index) => renderWidget(id, index))}
      </div>

    </DashboardLayout>
  )
}
