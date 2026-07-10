"use client"

import * as React from "react"
import { DashboardLayout } from "@/features/dashboard/layouts/dashboard-layout"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { Button } from "@/components/ui/button"
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel, 
  getPaginationRowModel, 
  flexRender, 
  ColumnDef, 
  SortingState, 
  ColumnFiltersState, 
  VisibilityState 
} from "@tanstack/react-table"
import { 
  ArrowUpDown, 
  ChevronDown, 
  MoreHorizontal, 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Download, 
  SlidersHorizontal,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  FilterX,
  Sparkles
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import toast from "react-hot-toast"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useSearchParams, useRouter } from "next/navigation"
import { RecordsService } from "@/features/dashboard/services/records-service"
import { NotificationsService } from "@/features/dashboard/services/notifications-service"
import { ActivityService } from "@/features/dashboard/services/activity-service"
import { RecordFormDialog } from "@/features/dashboard/components/record-form-dialog"
import { DeleteConfirmDialog } from "@/features/dashboard/components/delete-confirm-dialog"
import { RecordDetailsDialog } from "@/features/dashboard/components/record-details-dialog"
import { RenewRecordDialog } from "@/features/dashboard/components/renew-record-dialog"
import { ExportModal } from "@/features/dashboard/components/export-modal"
import { NLPParser } from "@/features/ai/utils/nlp-parser"
import { 
  AdvancedFiltersDrawer, 
  FilterState, 
  initialFilterState 
} from "@/features/dashboard/components/advanced-filters-drawer"
import { ExpiryRecord } from "@/features/dashboard/types"
import { calculateExpiry } from "@/features/dashboard/utils/expiry-engine"

export default function RecordsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = React.useState<ExpiryRecord[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorState, setErrorState] = React.useState<string | null>(null)
  
  // Modals state
  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<"add" | "edit">("add")
  const [selectedRecord, setSelectedRecord] = React.useState<ExpiryRecord | undefined>(undefined)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [recordToDelete, setRecordToDelete] = React.useState<ExpiryRecord | undefined>(undefined)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false)

  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [selectedRecordForDetails, setSelectedRecordForDetails] = React.useState<ExpiryRecord | undefined>(undefined)

  const [renewOpen, setRenewOpen] = React.useState(false)
  const [selectedRecordForRenewal, setSelectedRecordForRenewal] = React.useState<ExpiryRecord | undefined>(undefined)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [isSeeding, setIsSeeding] = React.useState(false)

  // Advanced Filters states
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [advancedFilters, setAdvancedFilters] = React.useState<FilterState>(initialFilterState)

  // Parse URL search parameters on load
  React.useEffect(() => {
    const category = searchParams.get("category") || ""
    const department = searchParams.get("department") || ""
    const priority = searchParams.get("priority") || ""
    const owner = searchParams.get("owner") || ""
    const status = searchParams.get("status") || ""
    const startDate = searchParams.get("start_date") || ""
    const endDate = searchParams.get("end_date") || ""
    const reminderDaysStr = searchParams.get("reminder_days") || ""
    const tagsStr = searchParams.get("tags") || ""

    const reminderDays = reminderDaysStr ? reminderDaysStr.split(",").map(Number).filter(Boolean) : []
    const tags = tagsStr ? tagsStr.split(",").filter(Boolean) : []

    setAdvancedFilters({
      category,
      department,
      priority,
      owner,
      status,
      startDate,
      endDate,
      reminderDays,
      tags
    })
  }, [searchParams])

  // Sync active filters to URL search parameters
  const applyAdvancedFilters = (newFilters: FilterState) => {
    const params = new URLSearchParams()
    
    // Retain target id parameter if details modal is open
    const targetId = searchParams.get("id")
    if (targetId) params.set("id", targetId)

    if (newFilters.category) params.set("category", newFilters.category)
    if (newFilters.department) params.set("department", newFilters.department)
    if (newFilters.priority) params.set("priority", newFilters.priority)
    if (newFilters.owner) params.set("owner", newFilters.owner)
    if (newFilters.status) params.set("status", newFilters.status)
    if (newFilters.startDate) params.set("start_date", newFilters.startDate)
    if (newFilters.endDate) params.set("end_date", newFilters.endDate)
    if (newFilters.reminderDays.length > 0) params.set("reminder_days", newFilters.reminderDays.join(","))
    if (newFilters.tags.length > 0) params.set("tags", newFilters.tags.join(","))

    router.replace(`/dashboard/records?${params.toString()}`)
    toast.success("Filters applied")
  }

  const resetAdvancedFilters = () => {
    const params = new URLSearchParams()
    const targetId = searchParams.get("id")
    if (targetId) params.set("id", targetId)
    router.replace(`/dashboard/records?${params.toString()}`)
    toast.success("Filters reset")
  }

  const handleAISmartSearch = async () => {
    if (!globalFilter.trim()) return

    // 1. Try client-side keyword matches
    const parsed = NLPParser.parseClientSide(globalFilter, data)
    if (parsed) {
      setAdvancedFilters({
        status: parsed.status,
        category: parsed.category,
        priority: parsed.priority,
        department: parsed.department,
        owner: "",
        startDate: "",
        endDate: "",
        reminderDays: [],
        tags: []
      })
      setGlobalFilter(parsed.searchQuery)
      toast.success("Client-side search filters applied!")
      return
    }

    // 2. Fallback to Groq AI translation
    const categoriesList = Array.from(new Set(data.map(r => r.category)))
    const loadToast = toast.loading("AI is parsing search intent...")
    try {
      const aiFilters = await NLPParser.parseWithAI(globalFilter, categoriesList)
      setAdvancedFilters({
        status: aiFilters.status,
        category: aiFilters.category,
        priority: aiFilters.priority as any,
        department: aiFilters.department,
        owner: "",
        startDate: "",
        endDate: "",
        reminderDays: [],
        tags: []
      })
      setGlobalFilter(aiFilters.searchQuery) // Set general table search query to vendor/search term
      toast.dismiss(loadToast)
      toast.success("AI search filters applied!")
    } catch (err) {
      console.error(err)
      toast.dismiss(loadToast)
      toast.error("AI search failed. Please use manual filters.")
    }
  }


  // Filter records dynamically based on active advanced filters
  const filteredData = React.useMemo(() => {
    return data.filter((row) => {
      if (advancedFilters.category && row.category !== advancedFilters.category) return false
      if (advancedFilters.status && row.status !== advancedFilters.status) return false
      if (advancedFilters.priority && row.priority !== advancedFilters.priority) return false
      
      if (advancedFilters.department && (!row.department || !row.department.toLowerCase().includes(advancedFilters.department.toLowerCase()))) return false
      if (advancedFilters.owner && (!row.owner || !row.owner.toLowerCase().includes(advancedFilters.owner.toLowerCase()))) return false
      
      if (advancedFilters.startDate && row.expiryDate < advancedFilters.startDate) return false
      if (advancedFilters.endDate && row.expiryDate > advancedFilters.endDate) return false
      
      if (advancedFilters.reminderDays.length > 0) {
        const rowReminders = row.reminderDays || []
        const hasAll = advancedFilters.reminderDays.every(d => rowReminders.includes(d))
        if (!hasAll) return false
      }
      
      if (advancedFilters.tags.length > 0) {
        const rowTags = row.tags || []
        const hasAllTags = advancedFilters.tags.every(t => rowTags.some(rt => rt.toLowerCase() === t.toLowerCase()))
        if (!hasAllTags) return false
      }

      return true
    })
  }, [data, advancedFilters])

  // Real-time Firestore sync listener
  React.useEffect(() => {
    if (!user?.uid) return

    setIsLoading(true)
    const unsubscribe = RecordsService.subscribeUserRecords(
      user.uid,
      (records) => {
        setData(records)
        setIsLoading(false)
        setErrorState(null)
      },
      (err) => {
        console.error("Firestore sync subscription error:", err)
        setErrorState("Failed to connect to real-time database. Please retry.")
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  const targetId = searchParams.get("id")

  React.useEffect(() => {
    if (targetId && data.length > 0) {
      const match = data.find(r => r.id === targetId)
      if (match) {
        setSelectedRecordForDetails(match)
        setDetailsOpen(true)
      }
    }
  }, [targetId, data])

  // Single Deletion handler (with Optimistic UI updates)
  const handleDeleteConfirm = async () => {
    if (!recordToDelete?.id) return
    setIsDeleting(true)
    
    // Optimistic UI Rollback backup
    const backupData = [...data]
    
    // Remove from local list state immediately (Optimistic UI)
    setData(prev => prev.filter(r => r.id !== recordToDelete.id))
    setDeleteConfirmOpen(false)

    try {
      await RecordsService.deleteRecord(recordToDelete.id)
      await NotificationsService.createNotification(user?.uid || "mock-user", {
        title: "Record Deleted",
        description: `"${recordToDelete.title}" was removed from your expiries registry.`,
        type: "expired",
        category: "warning"
      })
      await ActivityService.logActivity(user?.uid || "mock-user", {
        name: user?.displayName || "Admin",
        email: user?.email || "admin@expiry-iq.com",
        avatarUrl: user?.photoURL || ""
      }, {
        action: "delete",
        recordId: recordToDelete.id,
        recordTitle: recordToDelete.title,
        message: `deleted contract record "${recordToDelete.title}"`
      })
      toast.success("Record deleted successfully")
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete record. Rolling back...")
      setData(backupData)
    } finally {
      setIsDeleting(false)
      setRecordToDelete(undefined)
    }
  }

  // Batch Selection Deletion handler (with Optimistic UI updates)
  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => filteredData[parseInt(index)]?.id)
      .filter(Boolean) as string[]

    if (selectedIds.length === 0) return

    setIsBulkDeleting(true)
    const backupData = [...data]

    // Optimistic UI Update
    setData(prev => prev.filter(r => r.id && !selectedIds.includes(r.id)))
    setRowSelection({})

    try {
      await RecordsService.deleteRecordsBatch(selectedIds)
      await NotificationsService.createNotification(user?.uid || "mock-user", {
        title: "Batch Deletion Success",
        description: `${selectedIds.length} records were successfully deleted.`,
        type: "expired",
        category: "warning"
      })
      await ActivityService.logActivity(user?.uid || "mock-user", {
        name: user?.displayName || "Admin",
        email: user?.email || "admin@expiry-iq.com",
        avatarUrl: user?.photoURL || ""
      }, {
        action: "delete",
        recordId: "batch",
        recordTitle: `${selectedIds.length} records`,
        message: `executed batch deletion of ${selectedIds.length} contract records`
      })
      toast.success(`${selectedIds.length} records deleted successfully`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete records. Rolling back...")
      setData(backupData)
    } finally {
      setIsBulkDeleting(false)
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
        expiryDate: "2026-09-15",
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
        expiryDate: "2026-08-01",
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
        expiryDate: "2027-01-10",
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

  // Column definitions using TanStack
  const columns = React.useMemo<ColumnDef<ExpiryRecord>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded border-border bg-background h-4 w-4 cursor-pointer text-primary accent-primary"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => {
              if (el) {
                el.indeterminate = !table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()
              }
            }}
            onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded border-border bg-background h-4 w-4 cursor-pointer text-primary accent-primary"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(!!e.target.checked)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1.5 hover:text-foreground cursor-pointer"
          >
            <span>Record Name</span>
            <ArrowUpDown className="h-3 w-3 shrink-0" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5 text-left">
            <p className="font-bold text-foreground text-xs sm:text-sm">{row.original.title}</p>
            <p className="text-[10px] font-semibold text-muted-foreground truncate max-w-[200px]">{row.original.owner}</p>
          </div>
        )
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <div className="space-y-0.5 text-left">
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              {row.original.category}
            </span>
            <p className="text-[10px] font-bold text-muted-foreground/80">{row.original.department}</p>
          </div>
        )
      },
      {
        accessorKey: "expiryDate",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1.5 hover:text-foreground cursor-pointer"
          >
            <span>Expiry Date</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const { remainingDays, warningLevel } = calculateExpiry(row.original.expiryDate, row.original.createdAt)
          
          let countdownLabel = ""
          if (remainingDays === 0) {
            countdownLabel = "Expires Today"
          } else if (remainingDays < 0) {
            countdownLabel = `Expired ${Math.abs(remainingDays)}d ago`
          } else {
            countdownLabel = `In ${remainingDays} days`
          }

          const variantClasses = {
            critical: "bg-rose-500/10 text-rose-500 border-rose-500/20",
            warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            normal: "bg-primary/5 text-muted-foreground border-border"
          }
          return (
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-xs text-foreground font-bold">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{row.original.expiryDate}</span>
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold border ${variantClasses[warningLevel]}`}>
                {countdownLabel}
              </span>
            </div>
          )
        }
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const colors = {
            expired: "bg-rose-500/10 text-rose-500 border-rose-500/20",
            expiring_soon: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            renewed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            archived: "bg-muted text-muted-foreground border-border"
          }
          const recordStatus = row.original.status
          return (
            <div className="text-left">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold border uppercase tracking-wider ${colors[recordStatus as keyof typeof colors] || colors.active}`}>
                {recordStatus}
              </span>
            </div>
          )
        }
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const badges = {
            critical: "bg-red-500 text-white shadow-sm",
            high: "bg-amber-500/20 text-amber-600 dark:text-amber-500 border-amber-500/20",
            medium: "bg-blue-500/20 text-blue-600 dark:text-blue-500 border-blue-500/20",
            low: "bg-muted text-muted-foreground border-border"
          }
          return (
            <div className="text-left">
              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase border border-transparent ${badges[row.original.priority as keyof typeof badges]}`}>
                {row.original.priority}
              </span>
            </div>
          )
        }
      },
      {
        accessorKey: "cost",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1.5 hover:text-foreground cursor-pointer"
          >
            <span>Cost</span>
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-left space-y-0.5">
            <span className="text-xs sm:text-sm font-extrabold text-foreground">${row.original.cost}</span>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{row.original.renewalFrequency}</p>
          </div>
        )
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 border border-border bg-card/95 backdrop-blur-md shadow-md">
              <DropdownMenuLabel className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2.5 py-1.5">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedRecord(row.original)
                  setFormMode("edit")
                  setFormOpen(true)
                }}
                className="text-xs font-bold transition-colors cursor-pointer px-2.5 py-2"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span>Edit Record</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push(`/dashboard/records/${row.original.id}`)}
                className="text-xs font-bold transition-colors cursor-pointer px-2.5 py-2"
              >
                <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span>View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedRecordForRenewal(row.original)
                  setRenewOpen(true)
                }}
                className="text-xs font-bold transition-colors cursor-pointer px-2.5 py-2"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2 text-primary" />
                <span>Renew Expiry</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={() => {
                  setRecordToDelete(row.original)
                  setDeleteConfirmOpen(true)
                }}
                className="text-xs font-bold transition-colors text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 cursor-pointer px-2.5 py-2"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableHiding: false,
        size: 50
      }
    ],
    []
  )

  // Configure TanStack Table Instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  const selectedRowsCount = Object.keys(rowSelection).length

  // Quick reset filters helper
  const handleClearFilters = () => {
    setGlobalFilter("")
    resetAdvancedFilters()
  }

  // Count active filters in the URL params
  const activeFiltersCount = React.useMemo(() => {
    let count = 0
    if (advancedFilters.category) count++
    if (advancedFilters.status) count++
    if (advancedFilters.priority) count++
    if (advancedFilters.department) count++
    if (advancedFilters.owner) count++
    if (advancedFilters.startDate) count++
    if (advancedFilters.endDate) count++
    if (advancedFilters.reminderDays.length > 0) count++
    if (advancedFilters.tags.length > 0) count++
    return count
  }, [advancedFilters])

  return (
    <DashboardLayout>
      <PageHeader
        title="Expiry Records"
        description="Monitor, manage, and audit your digital domains, software licensing, and legal contracts."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setExportOpen(true)}
              className="h-10 text-sm font-bold gap-1.5 cursor-pointer bg-card hover:bg-muted/50 border-border"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button 
              onClick={() => {
                setSelectedRecord(undefined)
                setFormMode("add")
                setFormOpen(true)
              }} 
              className="h-10 text-sm font-bold gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Record</span>
            </Button>
          </div>
        }
      />

      {/* Database Error Banner */}
      {errorState && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs font-semibold mb-4 text-left select-none animate-pulse">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorState}</span>
        </div>
      )}

      {/* Toolbar Filters Panel */}
      <div className="flex flex-col gap-3 mb-4 select-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left panel: Search & live filters toggler */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input bar */}
            <div className="relative flex-1 max-w-xs min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search table or ask AI..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAISmartSearch()
                  }
                }}
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-background/50 text-xs font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
              {globalFilter && (
                <button
                  type="button"
                  onClick={handleAISmartSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  title="Translate natural query into filters"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Advanced Filters Trigger Drawer Toggle */}
            <Button
              variant="outline"
              onClick={() => setFiltersOpen(true)}
              className={`h-9 text-xs font-bold gap-1.5 cursor-pointer border-dashed transition-all ${
                activeFiltersCount > 0 
                  ? "bg-primary/5 border-primary text-primary hover:bg-primary/10" 
                  : "hover:bg-muted/50 border-border"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1.5 h-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-primary text-white text-[9px] font-extrabold px-1">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {/* Clear Filters Indicator */}
            {(globalFilter || activeFiltersCount > 0) && (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="h-9 text-xs font-bold gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <FilterX className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>

          {/* Right panel: Column Visibility toggle */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 text-xs font-bold gap-1.5 cursor-pointer">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Columns</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border border-border bg-card/95 backdrop-blur-md shadow-md">
                <DropdownMenuLabel className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2.5 py-1.5">Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="text-xs font-bold capitalize transition-colors cursor-pointer py-1.5"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id === "expiryDate" ? "Expiry Date" : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
      </div>

      {/* Floating Bulk Actions Banner */}
      {selectedRowsCount > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-4 text-left select-none animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground">
              {selectedRowsCount} {selectedRowsCount === 1 ? "record" : "records"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={isBulkDeleting}
              onClick={() => setExportOpen(true)}
              className="h-8.5 text-xs font-bold gap-1 cursor-pointer bg-card hover:bg-muted/50 border-border"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </Button>
            <Button
              variant="outline"
              disabled={isBulkDeleting}
              onClick={handleBulkDelete}
              className="h-8.5 text-xs font-bold gap-1 cursor-pointer bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
            >
              {isBulkDeleting ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin shrink-0" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Delete Selected</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Datatable Container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto select-none">
          <table className="w-full border-collapse border-spacing-0">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/20 h-11">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 text-left text-xs font-bold text-muted-foreground tracking-wider align-middle select-none relative"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-border/80 h-16 last:border-none animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-4 bg-muted rounded" /></td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <div className="h-4 w-48 bg-muted rounded" />
                        <div className="h-3.5 w-32 bg-muted/65 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <div className="h-4.5 w-16 bg-muted rounded-md" />
                        <div className="h-3 w-12 bg-muted/65 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 bg-muted rounded" />
                        <div className="h-3.5 w-20 bg-muted/65 rounded-full" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-4.5 w-16 bg-muted rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-12 bg-muted rounded" /></td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="h-4 w-12 bg-muted rounded" />
                        <div className="h-3 w-10 bg-muted/65 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-8 w-8 bg-muted rounded-md" /></td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (
                        target.closest('input[type="checkbox"]') || 
                        target.closest('button') || 
                        target.closest('a')
                      ) {
                        return
                      }
                      router.push(`/dashboard/records/${row.original.id}`)
                    }}
                    className={`border-b border-border/60 hover:bg-muted/10 h-16 last:border-none transition-colors align-middle cursor-pointer ${
                      row.getIsSelected() ? "bg-primary/5 hover:bg-primary/10" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-64 align-middle text-center">
                    {data.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-muted-foreground p-8 max-w-md mx-auto">
                        <AlertCircle className="h-10 w-10 text-primary mb-3" />
                        <h4 className="text-sm font-bold text-foreground mb-1">Welcome to ExpiryIQ</h4>
                        <p className="text-xs text-muted-foreground/80 leading-normal mb-4 font-semibold">
                          Get started by adding your first digital contract, domain name, or security certificate, or seed professional demo records to explore the dashboard.
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            disabled={isSeeding}
                            onClick={handleSeedDemoData}
                            className="h-9 text-xs font-bold cursor-pointer"
                          >
                            {isSeeding ? "Seeding..." : "Seed Demo Records"}
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedRecord(undefined)
                              setFormMode("add")
                              setFormOpen(true)
                            }}
                            className="h-9 text-xs font-bold cursor-pointer"
                          >
                            Add Record
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground p-8 max-w-sm mx-auto">
                        <AlertCircle className="h-10 w-10 text-muted-foreground/60 mb-3" />
                        <h4 className="text-sm font-bold text-foreground mb-1">No expiries found</h4>
                        <p className="text-xs text-muted-foreground/80 leading-normal mb-4 font-semibold">
                          Try refining your search query or filters. No records matched the active search filters.
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleClearFilters}
                          className="h-9 text-xs font-bold cursor-pointer"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Controls bar */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-border bg-muted/5 select-none">
          <div className="flex-1 text-xs text-muted-foreground font-bold">
            {table.getFilteredRowModel().rows.length > 0 && (
              <span>
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0 cursor-pointer hover:bg-muted/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0 cursor-pointer hover:bg-muted/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Record Form dialog Modal */}
      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        recordData={selectedRecord ? {
          id: selectedRecord.id,
          title: selectedRecord.title,
          category: selectedRecord.category,
          description: selectedRecord.description || "",
          expiryDate: selectedRecord.expiryDate,
          status: selectedRecord.status,
          priority: selectedRecord.priority,
          owner: selectedRecord.owner,
          department: selectedRecord.department,
          vendor: selectedRecord.vendor,
          createdBy: selectedRecord.createdBy || "mock-user",
          userId: selectedRecord.userId || user?.uid || "mock-user",
          cost: selectedRecord.cost,
          renewalFrequency: selectedRecord.renewalFrequency || "annually",
          reminderDays: selectedRecord.reminderDays || [7, 14, 30],
          attachments: selectedRecord.attachments || [],
          notes: selectedRecord.notes || "",
          tags: selectedRecord.tags || [],
          location: selectedRecord.location || ""
        } : undefined}
      />

      {/* Delete Confirmation Dialog modal */}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        recordTitle={recordToDelete?.title || ""}
        recordDetail={recordToDelete?.vendor}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      {/* Contract Details Dialog */}
      <RecordDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        record={selectedRecordForDetails}
      />

      {/* Expiry Renewal Dialog */}
      <RenewRecordDialog
        open={renewOpen}
        onOpenChange={setRenewOpen}
        record={selectedRecordForRenewal}
      />

      {/* Advanced Filters Drawer Panel */}
      <AdvancedFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        activeFilters={advancedFilters}
        onApplyFilters={applyAdvancedFilters}
        onResetFilters={resetAdvancedFilters}
      />

      {/* Reusable Export Modal */}
      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        allRecords={data}
        filteredRecords={filteredData}
      />
    </DashboardLayout>
  )
}
