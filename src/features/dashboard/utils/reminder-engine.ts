import { ExpiryRecord } from "../types"
import { calculateExpiry } from "./expiry-engine"

export interface ReminderEvaluation {
  remainingDays: number
  reminderDue: boolean
  reminderPriority: "low" | "medium" | "high" | "critical"
  reminderMessage: string
}

/**
 * Evaluates whether a reminder is due today for a specific expiry record.
 */
export function evaluateReminder(record: ExpiryRecord, today: Date = new Date()): ReminderEvaluation {
  const todayStr = today.toISOString().substring(0, 10)
  const { remainingDays } = calculateExpiry(record.expiryDate, todayStr)

  // Reminder is due if remainingDays is in the reminderDays array
  const isDue = record.reminderDays ? record.reminderDays.includes(remainingDays) : false

  // Determine priority: defaults to record priority, escalates for tight deadlines
  let priority = record.priority || "medium"
  if (remainingDays <= 3) {
    priority = "critical"
  } else if (remainingDays <= 7) {
    priority = "high"
  }

  const message = `Contract "${record.title}" is expiring in ${remainingDays} day${remainingDays === 1 ? "" : "s"}.`

  return {
    remainingDays,
    reminderDue: isDue,
    reminderPriority: priority as "low" | "medium" | "high" | "critical",
    reminderMessage: message
  }
}

/**
 * Filter list of records to return only those requiring reminders today.
 */
export function getRecordsNeedingReminders(records: ExpiryRecord[], today: Date = new Date()): ExpiryRecord[] {
  return records.filter((record) => {
    const { reminderDue } = evaluateReminder(record, today)
    return reminderDue
  })
}
