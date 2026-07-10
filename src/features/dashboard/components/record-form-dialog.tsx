"use client"

import * as React from "react"
import { useForm, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { recordSchema, ExpiryRecord } from "../schemas"
import { ModalWrapper } from "./modal-wrapper"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { 
  X, 
  Info,
  Sparkles
} from "lucide-react"
import toast from "react-hot-toast"
import { RecordsService } from "../services/records-service"
import { NotificationsService } from "../services/notifications-service"
import { ActivityService } from "../services/activity-service"
import { DocumentIntelligenceService } from "@/features/ai/services/document-intelligence-service"

interface RecordFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  recordData?: ExpiryRecord
  onSubmitSuccess?: (data: ExpiryRecord) => void
}

export function RecordFormDialog({
  open,
  onOpenChange,
  mode,
  recordData,
  onSubmitSuccess
}: RecordFormDialogProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Configure Form validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields, isDirty },
    reset
  } = useForm<ExpiryRecord>({
    resolver: zodResolver(recordSchema) as unknown as Resolver<ExpiryRecord>,
    defaultValues: {
      title: "",
      category: "",
      description: "",
      expiryDate: "",
      status: "active",
      priority: "medium",
      owner: user?.email || "",
      department: "",
      vendor: "",
      cost: 0,
      userId: user?.uid || "mock-user",
      createdBy: user?.uid || "mock-user",
      attachments: [],
      notes: "",
      tags: [],
      renewalFrequency: "annually",
      reminderDays: [7, 14, 30]
    }
  })

  // Watch reminder days and tags for custom inputs
  const currentReminderDays = watch("reminderDays") || []
  const currentTags = watch("tags") || []
  const currentAttachments = watch("attachments") || []
  
  const [tagInput, setTagInput] = React.useState("")
  const [attachmentInput, setAttachmentInput] = React.useState("")
  const [isAnalyzingFile, setIsAnalyzingFile] = React.useState(false)

  const handleAIPreFillFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIsAnalyzingFile(true)
      const loadToast = toast.loading("AI Document Intelligence is analyzing file details...")
      try {
        const metadata = await DocumentIntelligenceService.extractMetadata(file)
        
        // Auto-populate fields!
        if (metadata.title) setValue("title", metadata.title)
        if (metadata.expiryDate) setValue("expiryDate", metadata.expiryDate)
        if (metadata.vendor) setValue("vendor", metadata.vendor)
        if (metadata.department) setValue("department", metadata.department)
        
        // Map document type to matching category if possible
        if (metadata.documentType) {
          const typeLower = metadata.documentType.toLowerCase()
          if (typeLower.includes("license")) setValue("category", "Software License")
          else if (typeLower.includes("domain")) setValue("category", "Domain Name")
          else if (typeLower.includes("insurance")) setValue("category", "Insurance Policy")
          else if (typeLower.includes("contract") || typeLower.includes("agreement")) setValue("category", "Vendor Agreement")
          else setValue("category", metadata.documentType)
        }

        toast.dismiss(loadToast)
        toast.success("Document analyzed! Metadata pre-filled successfully.")
      } catch (err) {
        console.error(err)
        toast.dismiss(loadToast)
        toast.error("Failed to extract metadata from this document.")
      } finally {
        setIsAnalyzingFile(false)
      }
    }
  }

  // Populate data when in edit mode
  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && recordData) {
        reset(recordData)
      } else {
        reset({
          title: "",
          category: "",
          description: "",
          expiryDate: "",
          status: "active",
          priority: "medium",
          owner: user?.email || "",
          department: "",
          vendor: "",
          cost: 0,
          userId: user?.uid || "mock-user",
          createdBy: user?.uid || "mock-user",
          attachments: [],
          notes: "",
          tags: [],
          renewalFrequency: "annually",
          reminderDays: [7, 14, 30]
        })
      }
    }
  }, [open, mode, recordData, reset, user])

  // Custom reminder days handler
  const handleToggleReminderDay = (day: number) => {
    const exists = currentReminderDays.includes(day)
    if (exists) {
      setValue("reminderDays", currentReminderDays.filter(d => d !== day), { shouldDirty: true })
    } else {
      setValue("reminderDays", [...currentReminderDays, day].sort((a, b) => a - b), { shouldDirty: true })
    }
  }

  // Custom tags handler
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      if (!currentTags.includes(tagInput.trim())) {
        setValue("tags", [...currentTags, tagInput.trim()], { shouldDirty: true })
      }
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setValue("tags", currentTags.filter(t => t !== tagToRemove), { shouldDirty: true })
  }

  // Custom attachments handler
  const handleAddAttachment = () => {
    if (attachmentInput.trim()) {
      try {
        // Validate URL
        new URL(attachmentInput.trim())
        if (!currentAttachments.includes(attachmentInput.trim())) {
          setValue("attachments", [...currentAttachments, attachmentInput.trim()], { shouldDirty: true })
        }
        setAttachmentInput("")
      } catch (err) {
        toast.error("Please enter a valid URL")
      }
    }
  }

  const handleRemoveAttachment = (urlToRemove: string) => {
    setValue("attachments", currentAttachments.filter(u => u !== urlToRemove), { shouldDirty: true })
  }

  // Submit handler
  const onFormSubmit = async (data: ExpiryRecord) => {
    setIsSubmitting(true)
    try {
      if (mode === "add") {
        const recordId = await RecordsService.createRecord(user?.uid || "mock-user", data)
        await NotificationsService.createNotification(user?.uid || "mock-user", {
          title: "New Record Added",
          description: `"${data.title}" was successfully registered.`,
          type: "new_record",
          category: "success"
        })
        await ActivityService.logActivity(user?.uid || "mock-user", {
          name: user?.displayName || "Admin",
          email: user?.email || "admin@expiry-iq.com",
          avatarUrl: user?.photoURL || ""
        }, {
          action: "create",
          recordId: recordId,
          recordTitle: data.title,
          message: `registered a new contract record titled "${data.title}"`
        })
        toast.success("Record added successfully")
      } else {
        if (recordData?.id) {
          await RecordsService.updateRecord(recordData.id, data)
          await NotificationsService.createNotification(user?.uid || "mock-user", {
            title: "Record Updated",
            description: `"${data.title}" details were modified.`,
            type: "new_record",
            category: "info"
          })
          await ActivityService.logActivity(user?.uid || "mock-user", {
            name: user?.displayName || "Admin",
            email: user?.email || "admin@expiry-iq.com",
            avatarUrl: user?.photoURL || ""
          }, {
            action: "update",
            recordId: recordData.id,
            recordTitle: data.title,
            message: `updated details for contract "${data.title}"`
          })
          toast.success("Changes saved successfully")
        }
      }
      if (onSubmitSuccess) {
        onSubmitSuccess(data)
      }
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to save record:", err)
      toast.error("Failed to save record. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to get dirty fields labels
  const getDirtyFieldLabels = () => {
    return Object.keys(dirtyFields)
      .map(field => field.charAt(0).toUpperCase() + field.slice(1))
      .join(", ")
  }

  // Helper to generate dirty styling
  const getFieldClass = (fieldName: keyof ExpiryRecord) => {
    const base = "w-full px-3 py-1.5 text-xs font-semibold rounded-lg border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
    if (errors[fieldName]) {
      return `${base} border-rose-500 bg-rose-500/[0.01]`
    }
    if (mode === "edit" && dirtyFields[fieldName]) {
      return `${base} border-primary bg-primary/[0.01]`
    }
    return `${base} border-border`
  }

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "add" ? "Create New Expiry" : "Edit Expiry Record"}
      description={mode === "add" ? "Track a new licensing contract, security certificate, or domain registration." : "Modify fields and update settings for this contract."}
      contentClassName="sm:max-w-[760px] md:max-w-[840px]"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 select-none px-1">
        
        {/* Unsaved changes top banner */}
        {mode === "edit" && isDirty && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-[11px] leading-relaxed text-muted-foreground font-semibold">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span>
              Unsaved changes in: <strong className="text-primary font-bold">{getDirtyFieldLabels()}</strong>
            </span>
          </div>
        )}

        {mode === "add" && (
          <div className="border border-dashed border-primary/30 bg-primary/5 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-primary flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span>AI Document Intelligence Pre-fill</span>
              </h4>
              <p className="text-[10px] font-semibold text-muted-foreground">Upload any contract PDF or image. AI will automatically scan and pre-populate your registry details.</p>
            </div>
            <div className="shrink-0">
              <label className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-primary bg-primary text-white hover:bg-primary/95 text-xs font-bold cursor-pointer transition-colors shadow-sm gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isAnalyzingFile ? "Scanning..." : "Select Document"}</span>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  disabled={isAnalyzingFile}
                  onChange={handleAIPreFillFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {/* Left Column */}
          <div className="space-y-3">
            {/* Title field */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Title</span>
                {mode === "edit" && dirtyFields.title && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <input
                type="text"
                placeholder="e.g. AWS Production Hub"
                className={getFieldClass("title")}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.title.message}</p>
              )}
            </div>

            {/* Category field */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Category</span>
                {mode === "edit" && dirtyFields.category && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <select className={getFieldClass("category")} {...register("category")}>
                <option value="">Select Category</option>
                <option value="Software">Software</option>
                <option value="Security">Security</option>
                <option value="Domain">Domain Name</option>
                <option value="Legal">Legal Contract</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Marketing">Marketing Tools</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && (
                <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.category.message}</p>
              )}
            </div>

            {/* 3-Column sub-grid for Expiry Date, Renewal Frequency, & Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Expiry Date</span>
                  {mode === "edit" && dirtyFields.expiryDate && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </label>
                <input
                  type="date"
                  className={getFieldClass("expiryDate")}
                  {...register("expiryDate")}
                />
                {errors.expiryDate && (
                  <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.expiryDate.message}</p>
                )}
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Frequency</span>
                  {mode === "edit" && dirtyFields.renewalFrequency && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </label>
                <select className={getFieldClass("renewalFrequency")} {...register("renewalFrequency")}>
                  <option value="one-time">One-time</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Cost ($)</span>
                  {mode === "edit" && dirtyFields.cost && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="250"
                  className={getFieldClass("cost")}
                  {...register("cost")}
                />
                {errors.cost && (
                  <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.cost.message}</p>
                )}
              </div>
            </div>

            {/* Department field */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Department</span>
                {mode === "edit" && dirtyFields.department && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <input
                type="text"
                placeholder="e.g. Sales, IT, DevOps"
                className={getFieldClass("department")}
                {...register("department")}
              />
              {errors.department && (
                <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.department.message}</p>
              )}
            </div>

            {/* Description textarea */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Description</span>
                {mode === "edit" && dirtyFields.description && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <textarea
                placeholder="Brief details about what this record covers..."
                rows={1.5}
                className={getFieldClass("description")}
                {...register("description")}
              />
            </div>

            {/* Email Reminder Windows */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Email Reminder Windows (Days)</span>
                {mode === "edit" && dirtyFields.reminderDays && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border border-border bg-background/50 rounded-lg p-2">
                {[3, 7, 14, 30, 60, 90].map((day) => {
                  const checked = currentReminderDays.includes(day)
                  return (
                    <label key={day} className="flex items-center gap-1 text-[11px] font-bold text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleReminderDay(day)}
                        className="rounded border-border accent-primary h-3.5 w-3.5"
                      />
                      <span>{day}d</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {/* Owner email */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Owner Email</span>
                {mode === "edit" && dirtyFields.owner && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <input
                type="email"
                placeholder="owner@domain.com"
                className={getFieldClass("owner")}
                {...register("owner")}
              />
              {errors.owner && (
                <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.owner.message}</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Priority</span>
                {mode === "edit" && dirtyFields.priority && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <select className={getFieldClass("priority")} {...register("priority")}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Priority</option>
              </select>
            </div>

            {/* Vendor */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Vendor</span>
                {mode === "edit" && dirtyFields.vendor && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <input
                type="text"
                placeholder="e.g. DigiCert Inc, Microsoft"
                className={getFieldClass("vendor")}
                {...register("vendor")}
              />
              {errors.vendor && (
                <p className="text-[10px] font-bold text-rose-500 mt-0.5">{errors.vendor.message}</p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Tags (Press Enter)</span>
                {mode === "edit" && dirtyFields.tags && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <input
                type="text"
                placeholder="Add tag and press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-all font-sans"
              />
              {currentTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {currentTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary">
                      <span>{tag}</span>
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Attachments Documents</span>
                {mode === "edit" && dirtyFields.attachments && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste document URL link..."
                  value={attachmentInput}
                  onChange={(e) => setAttachmentInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAttachment}
                  className="h-7 text-[10px] font-bold px-2.5 cursor-pointer"
                >
                  Add
                </Button>
              </div>
              {currentAttachments.length > 0 && (
                <div className="space-y-1 pt-1 max-h-[60px] overflow-y-auto">
                  {currentAttachments.map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between border border-border/80 bg-background/50 rounded-lg p-1.5 text-[9px] font-semibold text-muted-foreground truncate">
                      <span className="truncate flex-1 pr-3">{url}</span>
                      <button type="button" onClick={() => handleRemoveAttachment(url)} className="text-muted-foreground hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Internal Notes</span>
                {mode === "edit" && dirtyFields.notes && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </label>
              <textarea
                placeholder="Add coworker internal notes..."
                rows={1.5}
                className={getFieldClass("notes")}
                {...register("notes")}
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
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
            className="h-9 text-xs font-bold px-4 cursor-pointer min-w-[90px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                <span>Saving...</span>
              </span>
            ) : (
              <span>{mode === "add" ? "Create" : "Save Changes"}</span>
            )}
          </Button>
        </div>

      </form>
    </ModalWrapper>
  )
}
