"use client"

import * as React from "react"
import { storage } from "@/lib/storage"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { RecordsService } from "../services/records-service"
import { ActivityService } from "../services/activity-service"
import { ExpiryRecord } from "../types"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { UploadCloud, FileText } from "lucide-react"
import toast from "react-hot-toast"

interface DocumentUploaderProps {
  record: ExpiryRecord
  onUploadComplete: () => void
}

const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "image/png",
  "image/jpeg"
]

const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export function DocumentUploader({ record, onUploadComplete }: DocumentUploaderProps) {
  const { user } = useAuth()
  const [dragActive, setDragActive] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateAndUpload = async (file: File) => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      toast.error("Format not supported. Please upload PDF, DOCX, PNG, or JPEG.")
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const storagePath = `contracts/${record.id}/${Date.now()}_${file.name}`
      const storageRef = ref(storage, storagePath)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(Math.round(progress))
        },
        (error) => {
          console.error("Upload error:", error)
          toast.error("Failed to upload document. Please retry.")
          setIsUploading(false)
          setUploadProgress(null)
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

          // Update record documents list in Firestore
          const updatedDocs = record.documents ? [...record.documents, newDoc] : [newDoc]
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
            message: `uploaded secure document "${file.name}"`
          })

          toast.success("Document uploaded successfully!")
          setIsUploading(false)
          setUploadProgress(null)
          onUploadComplete()
        }
      )
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong during file upload.")
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await validateAndUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await validateAndUpload(e.target.files[0])
    }
  }

  return (
    <div className="space-y-3 select-none text-left">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all relative ${
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 bg-muted/10"
        }`}
      >
        <input
          type="file"
          id="file-upload-input"
          className="hidden"
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          onChange={handleFileInput}
          disabled={isUploading}
        />

        <label 
          htmlFor="file-upload-input" 
          className="cursor-pointer flex flex-col items-center justify-center gap-2"
        >
          <div className="p-3 rounded-full bg-background border border-border text-muted-foreground">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">
              {isUploading ? "Uploading file..." : "Drag & drop file or browse"}
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Supports PDF, DOCX, PNG, JPEG (Max {MAX_SIZE_MB}MB)
            </p>
          </div>
        </label>

        {/* Upload Progress Bar Overlay */}
        {isUploading && uploadProgress !== null && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-4">
            <FileText className="h-6 w-6 text-primary animate-pulse mb-1.5" />
            <span className="text-xs font-bold text-foreground">Uploading document...</span>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div 
                style={{ width: `${uploadProgress}%` }} 
                className="h-full bg-primary transition-all duration-300"
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground mt-1.5">{uploadProgress}% Complete</span>
          </div>
        )}
      </div>
    </div>
  )
}
