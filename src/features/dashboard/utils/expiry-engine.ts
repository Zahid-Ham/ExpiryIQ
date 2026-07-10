import { differenceInDays, parseISO } from "date-fns"

export interface ExpiryCalculation {
  remainingDays: number
  status: "expired" | "expiring_soon" | "active"
  warningLevel: "critical" | "warning" | "normal"
  badgeColor: string
  progressPercentage: number
}

/**
 * Expiry Engine utility to automatically calculate exiry states.
 */
export function calculateExpiry(
  expiryDateStr: string,
  createdAtInput?: unknown
): ExpiryCalculation {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiryDate = parseISO(expiryDateStr)
  expiryDate.setHours(0, 0, 0, 0)
  
  const remainingDays = differenceInDays(expiryDate, today)

  let status: "expired" | "expiring_soon" | "active"
  let warningLevel: "critical" | "warning" | "normal"
  let badgeColor: string

  if (remainingDays < 0) {
    status = "expired"
    warningLevel = "critical"
    badgeColor = "rose" // Red
  } else if (remainingDays <= 30) {
    status = "expiring_soon"
    warningLevel = remainingDays <= 7 ? "critical" : "warning"
    badgeColor = "amber" // Yellow
  } else {
    status = "active"
    warningLevel = "normal"
    badgeColor = "emerald" // Green
  }

  // Calculate progress percentage
  let progressPercentage = 100
  if (createdAtInput) {
    let createdDate: Date | null = null
    
    // Parse firebase timestamp or string
    if (createdAtInput instanceof Date) {
      createdDate = createdAtInput
    } else if (typeof createdAtInput === "string") {
      createdDate = parseISO(createdAtInput)
    } else {
      const tsObj = createdAtInput as { seconds?: number }
      if (tsObj && tsObj.seconds !== undefined) {
        createdDate = new Date(tsObj.seconds * 1000)
      }
    }

    if (createdDate) {
      createdDate.setHours(0, 0, 0, 0)
      const totalDuration = differenceInDays(expiryDate, createdDate)
      if (totalDuration > 0) {
        const elapsed = differenceInDays(today, createdDate)
        progressPercentage = Math.max(0, Math.min(100, ((totalDuration - elapsed) / totalDuration) * 100))
      }
    }
  } else {
    // Default warning window is 90 days
    progressPercentage = Math.max(0, Math.min(100, (remainingDays / 90) * 100))
  }

  return {
    remainingDays,
    status,
    warningLevel,
    badgeColor,
    progressPercentage: Math.round(progressPercentage)
  }
}
