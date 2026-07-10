"use client"

import * as React from "react"
import { DashboardLayout } from "@/features/dashboard/layouts/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ExpiryRecord } from "@/features/dashboard/types"
import { ActivityItem } from "@/features/dashboard/services/activity-service"
import { calculateExpiry } from "@/features/dashboard/utils/expiry-engine"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { 
  Calendar, 
  DollarSign, 
  Tag, 
  FileText, 
  Mail, 
  Building2, 
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  History,
  Activity
} from "lucide-react"
import { useRouter } from "next/navigation"
import { format, parseISO, formatDistanceToNow } from "date-fns"
import { RenewRecordDialog } from "@/features/dashboard/components/renew-record-dialog"
import { DocumentUploader } from "@/features/dashboard/components/document-uploader"
import { DocumentViewerModal } from "@/features/dashboard/components/document-viewer-modal"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firestore"
import { FIRESTORE_COLLECTIONS } from "@/constants"

// Mock Record Fallback details
const mockRecordFallback: ExpiryRecord = {
  id: "mock-id-123",
  title: "AWS Cloud Infrastructure - Main Production",
  category: "Hosting",
  expiryDate: "2026-09-15",
  status: "active",
  priority: "high",
  owner: "devops@company.com",
  department: "Engineering",
  vendor: "Amazon Web Services",
  cost: 4500,
  renewalFrequency: "monthly",
  reminderDays: [30, 15, 7],
  notes: "Primary production environment hosting critical customer databases and microservices. Renewals require finance approval.",
  tags: ["AWS", "Production", "Critical"],
  attachments: ["https://aws.amazon.com", "https://docs.aws.amazon.com"],
  userId: "mock-user",
  createdBy: "mock-user",
  renewalHistory: [
    {
      previousExpiryDate: "2026-08-15",
      newExpiryDate: "2026-09-15",
      cost: 4200,
      renewedAt: "2026-07-14T10:00:00Z",
      renewedBy: "devops@company.com",
      notes: "Slight upgrade in instance sizes."
    }
  ]
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function RecordDetailsPage({ params }: PageProps) {
  const resolvedParams = React.use(params)
  const id = resolvedParams.id
  
  const { user } = useAuth()
  const router = useRouter()
  
  const [record, setRecord] = React.useState<ExpiryRecord | null>(null)
  const [activities, setActivities] = React.useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [renewDialogOpen, setRenewDialogOpen] = React.useState(false)
  const [viewerOpen, setViewerOpen] = React.useState(false)
  const [selectedDocIndex, setSelectedDocIndex] = React.useState<number | null>(null)

  // Fetch record with mock fallback if not found in Firestore
  React.useEffect(() => {
    if (!id) return

    let unsubscribe = () => {}
    let timer: NodeJS.Timeout | null = null

    if (user?.uid) {
      unsubscribe = onSnapshot(
        collection(db, FIRESTORE_COLLECTIONS.RECORDS),
        (snapshot) => {
          const matchedDoc = snapshot.docs.find(doc => doc.id === id)
          if (matchedDoc) {
            setRecord({
              ...matchedDoc.data() as ExpiryRecord,
              id: matchedDoc.id
            })
            setIsLoading(false)
          } else {
            // Check if mock ID match or fallback
            if (id === "mock-id-123") {
              setRecord(mockRecordFallback)
            } else {
              setRecord(null)
            }
            setIsLoading(false)
          }
        },
        (err) => {
          console.error("Firestore record load error:", err)
          if (id === "mock-id-123") {
            setRecord(mockRecordFallback)
          }
          setIsLoading(false)
        }
      )
    } else {
      // Mock mode prior to user signin or standalone
      timer = setTimeout(() => {
        if (id === "mock-id-123") {
          setRecord(mockRecordFallback)
        }
        setIsLoading(false)
      }, 0)
    }

    return () => {
      unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [id, user?.uid])

  // Fetch record-specific activities logs
  React.useEffect(() => {
    if (!id || !user?.uid) return

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.ACTIVITY),
      where("recordId", "==", id)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ActivityItem[] = []
        snapshot.forEach(doc => {
          list.push(doc.data() as ActivityItem)
        })
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        setActivities(list)
      },
      (err) => console.error("Error fetching record activity logs:", err)
    )

    return () => unsubscribe()
  }, [id, user?.uid])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <span className="h-7 w-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!record) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 select-none text-left max-w-md mx-auto space-y-4">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-extrabold text-foreground text-center">Record Not Found</h2>
          <p className="text-xs text-muted-foreground text-center font-semibold">
            The expiry record contract profile requested could not be resolved. It may have been deleted.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => router.push("/dashboard/records")} variant="outline" className="text-xs font-bold gap-1.5 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Registry</span>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { remainingDays, warningLevel, progressPercentage } = calculateExpiry(record.expiryDate, record.createdAt)

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
    <DashboardLayout>
      <div className="space-y-6 text-left select-none max-w-5xl mx-auto">
        
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => router.push("/dashboard/records")} 
            variant="ghost" 
            className="text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Records</span>
          </Button>
          
          <Button 
            onClick={() => setRenewDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold gap-1.5 cursor-pointer h-9 px-4.5 shadow-sm rounded-lg"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Renew Record</span>
          </Button>
        </div>

        {/* Header Contract Info */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-[250px]">
            <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-[9px] font-extrabold text-primary uppercase tracking-wide">
              {record.category}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-tight">
              {record.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground/90">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                <span>{record.department}</span>
              </span>
              <span>•</span>
              <span>Vendor: {record.vendor}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${
              statusColors[record.status as keyof typeof statusColors] || "bg-card border-border"
            }`}>
              {record.status}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${
              priorityBadges[record.priority as keyof typeof priorityBadges] || "bg-card border-border"
            }`}>
              {record.priority} Priority
            </span>
          </div>
        </div>

        {/* Expiry Countdown Box */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Expiry Proximity</span>
            <span className="text-xs font-extrabold text-foreground">
              {remainingDays < 0 ? (
                <span className="text-rose-500">Expired</span>
              ) : remainingDays === 0 ? (
                <span className="text-amber-500 font-extrabold">Expires Today</span>
              ) : (
                <span>{remainingDays} days remaining</span>
              )}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div 
              style={{ width: `${progressPercentage}%` }} 
              className={`h-full transition-all duration-500 ${
                warningLevel === "critical" ? "bg-rose-500" : warningLevel === "warning" ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Metadata Card */}
          <div className="md:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1.5">
              Contract Metadata
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Renewal Frequency</span>
                <p className="text-xs font-bold text-foreground capitalize flex items-center gap-1">
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{record.renewalFrequency}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Cycle Budget Cost</span>
                <p className="text-xs font-bold text-foreground flex items-center gap-0.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>${record.cost}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Contract Owner</span>
                <a href={`mailto:${record.owner}`} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{record.owner}</span>
                </a>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Target Expiry Date</span>
                <p className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{record.expiryDate}</span>
                </p>
              </div>
            </div>

            {/* Reminder Config */}
            {record.reminderDays && record.reminderDays.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Reminder Notification Milestones</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground mr-0.5 shrink-0" />
                  {record.reminderDays.map((day) => (
                    <span key={day} className="text-[10px] font-extrabold bg-card border border-border rounded-md px-2 py-0.5">
                      {day}d before
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {record.tags && record.tags.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Internal Tags</span>
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

          {/* Notes & Attachments Sidebar */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1.5">
              Documentation & Notes
            </h3>

            {/* Notes */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Internal Audit Notes</span>
              <p className="text-xs font-semibold text-muted-foreground/90 leading-relaxed bg-muted/20 border border-border rounded-lg p-3">
                {record.notes || "No notes logged for this contract profile."}
              </p>
            </div>

            {/* Legacy Linked Attachments */}
            {record.attachments && record.attachments.length > 0 && (
              <div className="space-y-2 border-t border-border/50 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Legacy Attachments</span>
                <div className="space-y-1.5">
                  {record.attachments.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 border border-border hover:border-primary bg-background/50 hover:bg-primary/[0.02] rounded-lg p-2 text-xs font-bold text-muted-foreground hover:text-primary transition-all truncate"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1 pr-1">{url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Secure Documents Directory Uploads */}
            <div className="space-y-2 border-t border-border/50 pt-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
                Secure Documents Directory
              </span>

              <DocumentUploader 
                record={record} 
                onUploadComplete={() => {}} 
              />

              {record.documents && record.documents.length > 0 ? (
                <div className="space-y-2 mt-3 pt-1">
                  {record.documents.map((docItem, idx) => {
                    const isImage = docItem.type.startsWith("image/")
                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          setSelectedDocIndex(idx)
                          setViewerOpen(true)
                        }}
                        className="border border-border rounded-lg p-2.5 bg-background/50 flex flex-col gap-2 hover:border-primary/45 hover:bg-primary/[0.01] transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {isImage ? (
                              <img 
                                src={docItem.downloadUrl} 
                                alt={docItem.name} 
                                className="h-9 w-9 rounded object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate max-w-[130px] sm:max-w-[160px] group-hover:text-primary transition-colors" title={docItem.name}>
                                {docItem.name}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground">
                                {formatBytes(docItem.size)}
                              </p>
                            </div>
                          </div>

                          <div 
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                            title="Preview document"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[8px] font-bold text-muted-foreground/80 border-t border-border/40 pt-1.5 mt-0.5">
                          <span>By: {docItem.uploadedBy.split("@")[0]}</span>
                          <span>{format(parseISO(docItem.uploadDate), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border rounded-lg text-[10px] text-muted-foreground font-semibold">
                  No secure files uploaded yet.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Timelines split panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Renewal History Timeline */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1.5 flex items-center gap-1.5">
              <History className="h-4 w-4 text-primary shrink-0" />
              <span>Renewal Audit Timeline</span>
            </h3>

            {record.renewalHistory && record.renewalHistory.length > 0 ? (
              <div className="relative border-l border-border pl-4 space-y-4 ml-2 py-0.5">
                {record.renewalHistory.map((item, idx) => (
                  <div key={idx} className="relative group text-xs text-left">
                    <div className="absolute -left-[21.5px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background flex items-center justify-center shrink-0" />
                    
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
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground/85 font-semibold">
                No cycle extensions have been logged yet.
              </div>
            )}
          </div>

          {/* Activity Logs Timeline */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest border-b border-border/60 pb-1.5 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary shrink-0" />
              <span>Record Activity Log</span>
            </h3>

            {activities.length > 0 ? (
              <div className="relative border-l border-border pl-4 space-y-4 ml-2 py-0.5">
                {activities.map((act) => {
                  let relativeTime = ""
                  try {
                    relativeTime = formatDistanceToNow(parseISO(act.createdAt), { addSuffix: true })
                  } catch {
                    relativeTime = "recent"
                  }
                  
                  return (
                    <div key={act.id} className="relative group text-xs text-left">
                      <div className="absolute -left-[21.5px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-border bg-background flex items-center justify-center shrink-0" />
                      
                      <div className="space-y-1.5 bg-muted/20 border border-border/80 rounded-lg p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground">
                          <span className="font-extrabold text-foreground">{act.userName}</span>
                          <span>{relativeTime}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-muted-foreground/90 pl-1">
                          {act.message}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground/85 font-semibold">
                No activity logs found for this contract profile.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Renewal Dialog Modal */}
      <RenewRecordDialog
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
        record={record}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        documentIndex={selectedDocIndex}
        record={record}
        onUpdate={() => {
          // Simply triggers update refresh
        }}
      />
    </DashboardLayout>
  )
}
