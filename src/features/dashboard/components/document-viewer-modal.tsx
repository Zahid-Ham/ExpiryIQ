"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExpiryRecord } from "../types"
import { RecordsService } from "../services/records-service"
import { ActivityService } from "../services/activity-service"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { storage, deleteFile } from "@/lib/storage"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  Clock, 
  User, 
  Calendar,
  Layers
} from "lucide-react"
import toast from "react-hot-toast"
import { format, parseISO } from "date-fns"

interface DocumentViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentIndex: number | null
  record: ExpiryRecord
  onUpdate: () => void
}

export function DocumentViewerModal({
  open,
  onOpenChange,
  documentIndex,
  record,
  onUpdate
}: DocumentViewerModalProps) {
  const { user } = useAuth()
  const [isReplacing, setIsReplacing] = React.useState(false)
  const [replaceProgress, setReplaceProgress] = React.useState<number | null>(null)
  
  if (documentIndex === null || !record.documents || !record.documents[documentIndex]) return null
  
  const docItem = record.documents[documentIndex]
  const isPdf = docItem.type === "application/pdf"
  const isImage = docItem.type.startsWith("image/")
  const isDocx = docItem.type.includes("wordprocessingml")
  
  // Format file size helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  // Delete Action handler
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${docItem.name}"?`)) return
    
    try {
      // 1. Delete from Storage (try to extract path from download URL or delete directly)
      try {
        const decodedUrl = decodeURIComponent(docItem.downloadUrl)
        const pathStart = decodedUrl.indexOf("/o/") + 3
        const pathEnd = decodedUrl.indexOf("?alt=")
        if (pathStart > 2 && pathEnd > pathStart) {
          const storagePath = decodedUrl.substring(pathStart, pathEnd)
          await deleteFile(storagePath)
        }
      } catch (err) {
        console.error("Storage delete warning:", err)
      }

      // 2. Remove document from Firestore record documents list
      const updatedDocs = record.documents!.filter((_, idx) => idx !== documentIndex)
      await RecordsService.updateRecord(record.id!, {
        documents: updatedDocs
      })

      // 3. Log audit activity
      await ActivityService.logActivity(user?.uid || "mock-user", {
        name: user?.displayName || "Admin",
        email: user?.email || "admin@expiry-iq.com",
        avatarUrl: user?.photoURL || ""
      }, {
        action: "update",
        recordId: record.id!,
        recordTitle: record.title,
        message: `deleted document "${docItem.name}"`
      })

      toast.success("Document deleted successfully")
      onUpdate()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete document.")
    }
  }

  // Replace File Action handler
  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10MB.")
      return
    }

    setIsReplacing(true)
    setReplaceProgress(0)

    try {
      // 1. Delete old storage file if path can be parsed
      try {
        const decodedUrl = decodeURIComponent(docItem.downloadUrl)
        const pathStart = decodedUrl.indexOf("/o/") + 3
        const pathEnd = decodedUrl.indexOf("?alt=")
        if (pathStart > 2 && pathEnd > pathStart) {
          const storagePath = decodedUrl.substring(pathStart, pathEnd)
          await deleteFile(storagePath)
        }
      } catch (err) {
        console.error("Storage delete warning during replace:", err)
      }

      // 2. Upload new file to Firebase Storage
      const storagePath = `contracts/${record.id}/${Date.now()}_${file.name}`
      const storageRef = ref(storage, storagePath)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setReplaceProgress(Math.round(progress))
        },
        (error) => {
          console.error("Replace upload error:", error)
          toast.error("Failed to upload replacement document.")
          setIsReplacing(false)
          setReplaceProgress(null)
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
          
          const newDoc = {
            name: file.name,
            size: file.size,
            uploadDate: new Date().toISOString(),
            uploadedBy: user?.email || "unknown@company.com",
            downloadUrl,
            type: file.type
          }

          // Overwrite the document entry inside the documents list
          const updatedDocs = [...record.documents!]
          updatedDocs[documentIndex] = newDoc

          await RecordsService.updateRecord(record.id!, {
            documents: updatedDocs
          })

          // Post audit activity log
          await ActivityService.logActivity(user?.uid || "mock-user", {
            name: user?.displayName || "Admin",
            email: user?.email || "admin@expiry-iq.com",
            avatarUrl: user?.photoURL || ""
          }, {
            action: "update",
            recordId: record.id!,
            recordTitle: record.title,
            message: `replaced document "${docItem.name}" with "${file.name}"`
          })

          toast.success("Document replaced successfully!")
          setIsReplacing(false)
          setReplaceProgress(null)
          onUpdate()
        }
      )
    } catch (err) {
      console.error(err)
      toast.error("Failed to replace document.")
      setIsReplacing(false)
      setReplaceProgress(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 border border-border bg-card/98 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[650px] gap-0">
        
        {/* Left Side: Document Preview Canvas */}
        <div className="flex-1 bg-muted/20 border-r border-border/60 flex items-center justify-center p-4 relative min-h-[300px] md:min-h-0">
          {isImage ? (
            <img 
              src={docItem.downloadUrl} 
              alt={docItem.name} 
              className="max-h-full max-w-full rounded-lg object-contain shadow-sm border border-border"
            />
          ) : isPdf ? (
            <iframe 
              src={`${docItem.downloadUrl}#toolbar=0`} 
              className="w-full h-full rounded-lg border border-border bg-background"
              title={docItem.name}
            />
          ) : (
            // DOCX / Other download placeholder card
            <div className="text-center p-6 border border-dashed border-border rounded-xl bg-background max-w-sm space-y-3 shadow-xs">
              <div className="p-3 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 w-fit mx-auto">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-bold text-foreground">Preview Not Supported</h4>
              <p className="text-[10px] font-semibold text-muted-foreground leading-normal max-w-xs">
                In-browser preview is not supported for {isDocx ? "DOCX" : "this file format"}. Please download the document to inspect its contents.
              </p>
              <a 
                href={docItem.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-primary hover:bg-primary/95 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download File</span>
              </a>
            </div>
          )}

          {/* Overwrite Progress Overlay */}
          {isReplacing && replaceProgress !== null && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-10">
              <RefreshCw className="h-6 w-6 text-primary animate-spin mb-1.5" />
              <span className="text-xs font-bold text-foreground">Replacing Document...</span>
              <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div 
                  style={{ width: `${replaceProgress}%` }} 
                  className="h-full bg-primary transition-all duration-300"
                />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground mt-1.5">{replaceProgress}% Complete</span>
            </div>
          )}
        </div>

        {/* Right Side: Metadata Pane & Controls */}
        <div className="w-full md:w-80 p-5 flex flex-col justify-between select-none text-left shrink-0 bg-card border-t md:border-t-0 border-border/80">
          <div className="space-y-4">
            <div className="space-y-1">
              <DialogTitle className="text-sm font-extrabold text-foreground leading-tight tracking-tight truncate max-w-[280px]">
                {docItem.name}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Secure Document File Card
              </DialogDescription>
            </div>

            {/* Metadata Summary List */}
            <div className="bg-muted/10 border border-border/60 rounded-xl p-3.5 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Version</span>
                </span>
                <span className="font-extrabold text-foreground">v1.0 (Current)</span>
              </div>

              <div className="flex justify-between items-center border-t border-border/40 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>File Size</span>
                </span>
                <span className="font-bold text-foreground">{formatBytes(docItem.size)}</span>
              </div>

              <div className="flex justify-between items-center border-t border-border/40 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span>Uploaded By</span>
                </span>
                <span className="font-bold text-foreground truncate max-w-[130px]">{docItem.uploadedBy.split("@")[0]}</span>
              </div>

              <div className="flex justify-between items-center border-t border-border/40 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Upload Date</span>
                </span>
                <span className="font-bold text-foreground">{format(parseISO(docItem.uploadDate), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Action Button Triggers */}
          <div className="space-y-2 pt-4 border-t border-border/50 mt-4 md:mt-0">
            {/* Download */}
            <a 
              href={docItem.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/95 text-white py-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download Document</span>
            </a>

            {/* Replace */}
            <div className="relative">
              <input
                type="file"
                id="file-replace-input"
                className="hidden"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                onChange={handleReplace}
                disabled={isReplacing}
              />
              <label 
                htmlFor="file-replace-input"
                className="w-full flex items-center justify-center gap-1.5 border border-border bg-background hover:bg-muted/30 text-foreground py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Replace File</span>
              </label>
            </div>

            {/* Delete */}
            <Button
              onClick={handleDelete}
              variant="ghost"
              className="w-full justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 text-xs font-bold flex items-center gap-1.5 cursor-pointer py-2 rounded-lg"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Document</span>
            </Button>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  )
}
