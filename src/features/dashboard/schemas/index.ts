import { z } from "zod"

export const recordSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters long"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  expiryDate: z.string().min(1, "Expiry date is required"),
  status: z.enum(["active", "expired", "expiring_soon", "renewed", "archived"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  owner: z.string().email("Invalid owner email address"),
  department: z.string().min(1, "Department is required"),
  vendor: z.string().min(1, "Vendor name is required"),
  cost: z.coerce.number().min(0, "Cost must be a positive number").default(0),
  createdBy: z.string(),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
  renewedAt: z.unknown().optional(),
  attachments: z.array(z.string()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  renewalFrequency: z.enum(["one-time", "monthly", "quarterly", "annually", "custom"]),
  reminderDays: z.array(z.number().int().min(1)).optional(),
  renewalHistory: z.array(z.object({
    previousExpiryDate: z.string(),
    newExpiryDate: z.string(),
    renewedAt: z.string(),
    cost: z.number(),
    notes: z.string().optional(),
    renewedBy: z.string()
  })).optional(),
  documents: z.array(z.object({
    name: z.string(),
    size: z.number(),
    uploadDate: z.string(),
    uploadedBy: z.string(),
    downloadUrl: z.string(),
    type: z.string()
  })).optional(),
  isDemo: z.boolean().optional()
})

export type ExpiryRecord = z.infer<typeof recordSchema>
