import { test } from "node:test"
import assert from "node:assert"
import { evaluateReminder, getRecordsNeedingReminders } from "./reminder-engine"
import { ExpiryRecord } from "../types"
import { format, addDays } from "date-fns"

test("Reminder Engine - Evaluation Logic", async (t) => {
  const baseDate = new Date()
  baseDate.setHours(0, 0, 0, 0)

  const mockRecord: ExpiryRecord = {
    id: "test-id",
    title: "SSL Certificate Alpha",
    category: "Security",
    expiryDate: format(addDays(baseDate, 7), "yyyy-MM-dd"), // 7 days from now
    priority: "medium",
    owner: "secops@company.com",
    department: "IT Ops",
    vendor: "DigiCert",
    cost: 300,
    renewalFrequency: "annually",
    reminderDays: [30, 15, 7, 3, 1],
    attachments: [],
    notes: "",
    tags: [],
    location: "",
    userId: "user-1",
    createdBy: "user-1",
    status: "active"
  }

  await t.test("matches reminder day successfully", () => {
    // Should match because expiryDate is 7 days from baseDate, which is in reminderDays
    const res = evaluateReminder(mockRecord, baseDate)

    assert.strictEqual(res.remainingDays, 7)
    assert.strictEqual(res.reminderDue, true)
    assert.strictEqual(res.reminderPriority, "high") // Escalated priority
    assert.strictEqual(res.reminderMessage, 'Contract "SSL Certificate Alpha" is expiring in 7 days.')
  })

  await t.test("no reminder when day is not matching list", () => {
    // 6 days before expiry -> set expiryDate to 6 days from now
    const recordSixDays = {
      ...mockRecord,
      expiryDate: format(addDays(baseDate, 6), "yyyy-MM-dd")
    }
    const res = evaluateReminder(recordSixDays, baseDate)

    assert.strictEqual(res.remainingDays, 6)
    assert.strictEqual(res.reminderDue, false)
    assert.strictEqual(res.reminderPriority, "high")
  })

  await t.test("filters records needing reminders successfully", () => {
    const recordsList: ExpiryRecord[] = [
      { ...mockRecord, id: "r1", title: "Record 1", expiryDate: format(addDays(baseDate, 7), "yyyy-MM-dd"), reminderDays: [7] }, // due today
      { ...mockRecord, id: "r2", title: "Record 2", expiryDate: format(addDays(baseDate, 8), "yyyy-MM-dd"), reminderDays: [7] }  // not due today
    ]

    const dueList = getRecordsNeedingReminders(recordsList, baseDate)

    assert.strictEqual(dueList.length, 1)
    assert.strictEqual(dueList[0].id, "r1")
  })
})
