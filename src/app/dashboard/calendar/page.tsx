"use client"

import * as React from "react"
import { DashboardLayout } from "@/features/dashboard/layouts/dashboard-layout"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText,
  Activity,
  ChevronRight as ArrowRight,
  RefreshCw,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { RecordsService } from "@/features/dashboard/services/records-service"
import { RecordDetailsDialog } from "@/features/dashboard/components/record-details-dialog"
import { ExpiryRecord } from "@/features/dashboard/types"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  parseISO,
  isToday,
  addDays
} from "date-fns"
import { calculateExpiry } from "@/features/dashboard/utils/expiry-engine"
import toast from "react-hot-toast"

type ViewType = "month" | "week" | "agenda"

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [view, setView] = React.useState<ViewType>("month")
  const [records, setRecords] = React.useState<ExpiryRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSeeding, setIsSeeding] = React.useState(false)

  // Filters State
  const [filterCategory, setFilterCategory] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("")
  const [filterPriority, setFilterPriority] = React.useState("")
  
  // Details Modal
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<ExpiryRecord | undefined>(undefined)

  // Real-time subscribe to user records from Firestore
  React.useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = RecordsService.subscribeUserRecords(
      user.uid,
      (data) => {
        setRecords(data)
        setIsLoading(false)
      },
      (err) => {
        console.error("Firestore calendar records subscribe error:", err)
        setIsLoading(false)
      }
    )
    return () => unsubscribe()
  }, [user?.uid])

  // Generate demo fallback elements if user database is empty
  const activeRecords = React.useMemo(() => {
    if (records.length > 0) return records

    const baseDate = new Date()
    return [
      {
        id: "mock-1",
        title: "DigiCert Production SSL Wildcard",
        category: "Security",
        expiryDate: format(addDays(baseDate, 1), "yyyy-MM-dd"),
        priority: "critical" as const,
        owner: "security@company.com",
        department: "IT Ops",
        vendor: "DigiCert Inc",
        cost: 450,
        reminderDays: [7, 14],
        status: "expiring_soon",
        createdAt: format(baseDate, "yyyy-MM-dd"),
        attachments: [],
        notes: "Renewal requires validation of DNS verification records.",
        userId: "mock-user",
        createdBy: "mock-user",
        renewalFrequency: "annually" as const
      },
      {
        id: "mock-2",
        title: "AWS Cluster Compute Reservation",
        category: "Infrastructure",
        expiryDate: format(addDays(baseDate, 5), "yyyy-MM-dd"),
        priority: "high" as const,
        owner: "devops@company.com",
        department: "Engineering",
        vendor: "Amazon Web Services",
        cost: 1200,
        reminderDays: [30],
        status: "active",
        createdAt: format(baseDate, "yyyy-MM-dd"),
        attachments: [],
        notes: "Convert to savings plan cycles upon renewal.",
        userId: "mock-user",
        createdBy: "mock-user",
        renewalFrequency: "monthly" as const
      },
      {
        id: "mock-3",
        title: "Figma Professional Team Workspace",
        category: "Software",
        expiryDate: format(addDays(baseDate, 12), "yyyy-MM-dd"),
        priority: "medium" as const,
        owner: "design-lead@company.com",
        department: "Product Design",
        vendor: "Figma Inc",
        cost: 180,
        reminderDays: [7],
        status: "active",
        createdAt: format(baseDate, "yyyy-MM-dd"),
        attachments: [],
        notes: "Seat audit required before billing processing.",
        userId: "mock-user",
        createdBy: "mock-user",
        renewalFrequency: "monthly" as const
      },
      {
        id: "mock-4",
        title: "Office Lease Contract",
        category: "Legal",
        expiryDate: format(subDays(baseDate, 2), "yyyy-MM-dd"),
        priority: "critical" as const,
        owner: "operations@company.com",
        department: "Operations",
        vendor: "Acme Real Estate",
        cost: 4800,
        reminderDays: [60, 90],
        status: "expired",
        createdAt: format(baseDate, "yyyy-MM-dd"),
        attachments: [],
        notes: "Urgent: Lease renewal renegotiation deadline passed.",
        userId: "mock-user",
        createdBy: "mock-user",
        renewalFrequency: "annually" as const
      }
    ] as ExpiryRecord[]
  }, [records])

  function subDays(date: Date, days: number): Date {
    return addDays(date, -days)
  }

  // Filter events dynamically
  const filteredRecords = React.useMemo(() => {
    return activeRecords.filter((r) => {
      if (filterCategory && r.category !== filterCategory) return false
      if (filterStatus && r.status !== filterStatus) return false
      if (filterPriority && r.priority !== filterPriority) return false
      return true
    })
  }, [activeRecords, filterCategory, filterStatus, filterPriority])

  // Today's Expiries list (unfiltered for accurate alerts)
  const todaysExpiries = React.useMemo(() => {
    return activeRecords.filter((r) => {
      try {
        return isSameDay(parseISO(r.expiryDate), new Date())
      } catch {
        return false
      }
    })
  }, [activeRecords])

  // Upcoming expiries in next 30 days (unfiltered)
  const upcomingExpiries = React.useMemo(() => {
    const todayVal = new Date()
    const limitVal = addDays(todayVal, 30)
    return activeRecords
      .filter((r) => {
        try {
          const expDate = parseISO(r.expiryDate)
          return expDate >= todayVal && expDate <= limitVal
        } catch {
          return false
        }
      })
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
  }, [activeRecords])

  // Navigation handlers
  const handlePrev = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(subWeeks(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(addWeeks(currentDate, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleOpenDetails = (record: ExpiryRecord) => {
    setSelectedRecord(record)
    setDetailsOpen(true)
  }

  // Dynamic Highlight Classes based on status: Expired, Today, Upcoming
  const getEventHighlightClasses = (expiryDate: string, createdAt?: unknown) => {
    try {
      const { remainingDays } = calculateExpiry(expiryDate, (createdAt as string) || expiryDate)
      if (remainingDays < 0) {
        return "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
      }
      if (remainingDays === 0) {
        return "border-indigo-600 bg-indigo-600/15 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-600/25 ring-1 ring-indigo-600/30 font-extrabold"
      }
      if (remainingDays > 0 && remainingDays <= 30) {
        return "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
      }
      return "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
    } catch {
      return "border-border bg-muted/50 text-muted-foreground"
    }
  }

  const handleSeedDemoData = async () => {
    if (!user?.uid) return
    setIsSeeding(true)
    const seedToast = toast.loading("Seeding demo records...")
    
    const DEMO_RECORDS = [
      {
        title: "Global SSL Wildcard Certificate",
        category: "Security",
        description: "Production wildcard SSL cert for *.expiry-iq.com",
        expiryDate: format(addDays(new Date(), 2), "yyyy-MM-dd"),
        priority: "critical" as const,
        owner: "security@expiry-iq.com",
        department: "IT Operations",
        vendor: "DigiCert Inc",
        cost: 450,
        renewalFrequency: "annually" as const,
        reminderDays: [7, 14, 30],
        attachments: [],
        notes: "Requires validation email verification.",
        tags: ["ssl", "security", "infrastructure"],
        location: "AWS ACM",
        createdBy: "mock-user"
      },
      {
        title: "AWS Cloud Staging Infrastructure",
        category: "Infrastructure",
        description: "Staging sandbox compute resources & DB cluster",
        expiryDate: format(addDays(new Date(), 10), "yyyy-MM-dd"),
        priority: "high" as const,
        owner: "devops@expiry-iq.com",
        department: "Engineering",
        vendor: "Amazon Web Services",
        cost: 850,
        renewalFrequency: "monthly" as const,
        reminderDays: [14, 30],
        attachments: [],
        notes: "Review under-utilized instances before renewal.",
        tags: ["aws", "cloud", "staging"],
        location: "AWS Console",
        createdBy: "mock-user"
      },
      {
        title: "Microsoft 365 Enterprise Suite",
        category: "Software",
        description: "Office 365 E5 licenses for all employees",
        expiryDate: format(addDays(new Date(), 45), "yyyy-MM-dd"),
        priority: "medium" as const,
        owner: "it-procurement@expiry-iq.com",
        department: "IT Operations",
        vendor: "Microsoft Corporation",
        cost: 2400,
        renewalFrequency: "annually" as const,
        reminderDays: [30, 60],
        attachments: [],
        notes: "Check license count allocation before billing.",
        tags: ["office", "productivity", "software"],
        location: "Admin Portal",
        createdBy: "mock-user"
      }
    ]

    try {
      for (const record of DEMO_RECORDS) {
        await RecordsService.createRecord(user.uid, record)
      }
      toast.dismiss(seedToast)
      toast.success("Demo records seeded successfully!")
    } catch (err) {
      console.error(err)
      toast.dismiss(seedToast)
      toast.error("Failed to seed demo records. Please try again.")
    } finally {
      setIsSeeding(false)
    }
  }

  const handleResetFilters = () => {
    setFilterCategory("")
    setFilterStatus("")
    setFilterPriority("")
    toast.success("Filters reset")
  }

  // 1. Month Grid Generation
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="grid grid-cols-7 border-t border-l border-border rounded-xl overflow-hidden bg-card shadow-sm">
        {/* Days headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground border-r border-b border-border bg-muted/15 select-none">
            {day}
          </div>
        ))}

        {/* Days grid cells */}
        {days.map((day, idx) => {
          const dayEvents = filteredRecords.filter((r) => {
            try {
              return isSameDay(parseISO(r.expiryDate), day)
            } catch {
              return false
            }
          })
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isCurrentDay = isToday(day)

          return (
            <div
              key={idx}
              className={`min-h-[100px] sm:min-h-[120px] p-2 border-r border-b border-border flex flex-col justify-between transition-colors ${
                isCurrentMonth ? "bg-card" : "bg-muted/15 opacity-60"
              } ${isCurrentDay ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-center justify-between mb-1 select-none">
                <span className={`text-[11px] font-extrabold h-6 w-6 flex items-center justify-center rounded-full ${
                  isCurrentDay ? "bg-primary text-white animate-pulse" : "text-foreground"
                }`}>
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[9px] font-bold text-muted-foreground/80">
                    {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] pr-0.5">
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleOpenDetails(event)}
                    className={`w-full text-left truncate px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                      getEventHighlightClasses(event.expiryDate, event.createdAt)
                    }`}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 2. Week Grid Generation
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(weekStart)
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 border-t border-l border-border rounded-xl overflow-hidden bg-card shadow-sm">
        {days.map((day, idx) => {
          const dayEvents = filteredRecords.filter((r) => {
            try {
              return isSameDay(parseISO(r.expiryDate), day)
            } catch {
              return false
            }
          })
          const isCurrentDay = isToday(day)

          return (
            <div
              key={idx}
              className={`min-h-[250px] p-3 border-r border-b border-border flex flex-col ${
                isCurrentDay ? "bg-primary/5 animate-fade-in" : "bg-card"
              }`}
            >
              <div className="border-b border-border/80 pb-2 mb-3 select-none flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    {format(day, "EEEE")}
                  </p>
                  <p className="text-sm font-extrabold text-foreground">
                    {format(day, "MMM d")}
                  </p>
                </div>
                {isCurrentDay && (
                  <span className="bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Today</span>
                )}
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleOpenDetails(event)}
                      className={`w-full text-left p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer block space-y-1 ${
                        getEventHighlightClasses(event.expiryDate, event.createdAt)
                      }`}
                    >
                      <p className="font-extrabold truncate">{event.title}</p>
                      <div className="flex items-center justify-between text-[9px] opacity-95">
                        <span className="uppercase tracking-wide">{event.category}</span>
                        <span>${event.cost}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground/60 italic font-semibold text-center mt-8 select-none">No expiries</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 3. Agenda Chronological Checklist View
  const renderAgendaView = () => {
    const sorted = [...filteredRecords].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))

    return (
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="p-3 border-b border-border/60 bg-muted/15 select-none">
          <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest pl-1">Chronological Expiries Agenda</h4>
        </div>
        <div className="divide-y divide-border/60">
          {sorted.length > 0 ? (
            sorted.map((event) => {
              const priorityBadges = {
                critical: "bg-rose-500 text-white shadow-sm",
                high: "bg-amber-500/20 text-amber-600 dark:text-amber-500 border-amber-500/25",
                medium: "bg-blue-500/20 text-blue-600 dark:text-blue-500 border-blue-500/25",
                low: "bg-muted text-muted-foreground border-border"
              }
              const { remainingDays } = calculateExpiry(event.expiryDate, event.createdAt)
              
              let highlightBorder = "border-l-4 border-l-emerald-500"
              if (remainingDays < 0) {
                highlightBorder = "border-l-4 border-l-rose-500"
              } else if (remainingDays === 0) {
                highlightBorder = "border-l-4 border-l-indigo-600"
              } else if (remainingDays > 0 && remainingDays <= 30) {
                highlightBorder = "border-l-4 border-l-amber-500"
              }

              return (
                <div
                  key={event.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-muted/10 transition-colors gap-3 border-l-0 ${highlightBorder}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-extrabold text-foreground">{event.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/90 mt-0.5">
                        <span>{event.vendor}</span>
                        <span>•</span>
                        <span>{event.category}</span>
                        <span>•</span>
                        <span>{event.owner}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 select-none">
                    <span className={`text-[9px] font-extrabold border uppercase px-1.5 py-0.5 rounded ${priorityBadges[event.priority as keyof typeof priorityBadges]}`}>
                      {event.priority}
                    </span>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{event.expiryDate}</span>
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground/80 mt-0.5">${event.cost} ({event.renewalFrequency})</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleOpenDetails(event)}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground font-semibold">
              No registered events match active filters.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Expiry Calendar"
        description="Visualize contract deadlines, renewals, and warnings across months, weeks, or agenda streams."
        actions={
          <div className="flex items-center border border-border bg-card rounded-lg p-0.5 shadow-sm">
            {(["month", "week", "agenda"] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize cursor-pointer transition-all ${
                  view === v ? "bg-primary text-white font-extrabold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      {/* Live Toolbar Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 select-none">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Software">Software</option>
            <option value="Security">Security</option>
            <option value="Domain">Domain Name</option>
            <option value="Legal">Legal Contract</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Marketing">Marketing Tools</option>
            <option value="Utilities">Utilities</option>
            <option value="Other">Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="renewed">Renewed</option>
            <option value="archived">Archived</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="h-9 px-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-all cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Reset Filters */}
          {(filterCategory || filterStatus || filterPriority) && (
            <Button
              variant="ghost"
              onClick={handleResetFilters}
              className="h-9 text-xs font-bold gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none">
        
        {/* Left Side: Calendar main view */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-xl p-3 shadow-sm select-none">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrev} className="h-8 w-8 p-0 cursor-pointer hover:bg-muted/50">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday} className="h-8 text-xs font-bold cursor-pointer hover:bg-muted/50">
                Today
              </Button>
              <Button variant="outline" onClick={handleNext} className="h-8 w-8 p-0 cursor-pointer hover:bg-muted/50">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <CalendarIcon className="h-4.5 w-4.5 text-primary shrink-0" />
              <span>
                {view === "month" 
                  ? format(currentDate, "MMMM yyyy")
                  : `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`
                }
              </span>
            </h3>

            <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/80">
              {view} view
            </div>
          </div>

          {isLoading ? (
            <div className="h-96 border border-border bg-card rounded-xl flex items-center justify-center">
              <span className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : view === "month" ? (
            renderMonthView()
          ) : view === "week" ? (
            renderWeekView()
          ) : (
            renderAgendaView()
          )}
        </div>

        {/* Right Side: Side Info Panels */}
        <div className="space-y-4">
          
          {/* Today's Expiry panel */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm text-left">
            <div className="p-3 border-b border-border/60 bg-muted/15 flex items-center justify-between select-none">
              <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Today&apos;s Expiries</h4>
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="p-3 space-y-2">
              {todaysExpiries.length > 0 ? (
                todaysExpiries.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleOpenDetails(event)}
                    className="w-full border border-border hover:border-primary/25 rounded-lg p-2.5 bg-background text-left transition-all cursor-pointer block space-y-1"
                  >
                    <p className="text-xs font-bold text-foreground leading-snug truncate">{event.title}</p>
                    <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/80">
                      <span>{event.category}</span>
                      <span>${event.cost}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-[11px] text-muted-foreground/80 font-bold select-none flex flex-col items-center justify-center gap-1.5">
                  <Activity className="h-5 w-5 text-muted-foreground/50" />
                  <span>No expiries scheduled today</span>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Expiries panel (Next 30 Days) */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm text-left">
            <div className="p-3 border-b border-border/60 bg-muted/15 flex items-center gap-1.5 select-none">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Upcoming (Next 30 Days)</h4>
            </div>
            <div className="p-3 divide-y divide-border/50 max-h-[300px] overflow-y-auto">
              {upcomingExpiries.length > 0 ? (
                upcomingExpiries.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleOpenDetails(event)}
                    className="w-full py-2.5 text-left transition-colors hover:bg-muted/10 cursor-pointer block space-y-1 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-foreground leading-tight truncate flex-1">{event.title}</p>
                      <span className="text-[9px] font-extrabold text-primary bg-primary/5 px-1 py-0.2 rounded shrink-0">
                        {event.expiryDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-semibold text-muted-foreground">
                      <span>{event.vendor}</span>
                      <span className="uppercase font-bold text-muted-foreground/80">{event.priority} priority</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-[11px] text-muted-foreground/80 font-semibold select-none">
                  No upcoming expiries in the next 30 days.
                </div>
              )}
            </div>
          </div>

          {/* Demo Data Onboarding Box (Only visible if the Firestore database is completely empty) */}
          {records.length === 0 && (
            <div className="border border-border border-dashed rounded-xl bg-muted/20 p-4 text-center space-y-3">
              <AlertCircle className="h-6 w-6 text-primary mx-auto" />
              <div>
                <h5 className="text-xs font-extrabold text-foreground">Interactive Playground</h5>
                <p className="text-[10px] font-semibold text-muted-foreground/80 leading-normal mt-1">
                  You are viewing static demo fallback items. Click below to seed demo expiries directly into your Firestore database.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isSeeding}
                onClick={handleSeedDemoData}
                className="w-full h-8 text-[10px] font-extrabold cursor-pointer"
              >
                {isSeeding ? "Seeding..." : "Seed Demo Expiries"}
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Contract Details Dialog Profile Modal */}
      <RecordDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        record={selectedRecord}
      />
    </DashboardLayout>
  )
}
