import { 
  getDocument, 
  setDocument, 
  updateDocument, 
  deleteDocument, 
  queryCollectionPaged,
  QueryOptions,
  getTimestamp,
  executeBatch,
  db
} from "@/lib/firestore"
import { FIRESTORE_COLLECTIONS } from "@/constants"
import { ExpiryRecord } from "../types"
import { calculateExpiry } from "../utils/expiry-engine"
import { 
  QueryDocumentSnapshot, 
  DocumentData,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore"

/**
 * Service to manage Expiry Records in Firestore.
 */
export const RecordsService = {
  /**
   * Creates a new expiry record in Firestore.
   * Status is calculated automatically and cannot be entered manually.
   */
  async createRecord(userId: string, record: Omit<ExpiryRecord, "userId" | "status" | "createdAt" | "updatedAt">): Promise<string> {
    const recordId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Automatically calculate status using Expiry Engine
    const { status } = calculateExpiry(record.expiryDate)
    
    const newRecord: ExpiryRecord = {
      ...record,
      userId,
      status, // Enforced automatic calculation
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    }
    await setDocument(FIRESTORE_COLLECTIONS.RECORDS, newRecord, recordId)
    return recordId
  },

  /**
   * Fetches a single expiry record by its ID.
   */
  async getRecord(recordId: string): Promise<ExpiryRecord | null> {
    return getDocument(FIRESTORE_COLLECTIONS.RECORDS, recordId) as Promise<ExpiryRecord | null>
  },

  /**
   * Updates an existing expiry record.
   * Re-calculates status automatically if the expiryDate is modified.
   */
  async updateRecord(recordId: string, record: Partial<Omit<ExpiryRecord, "userId" | "createdAt" | "updatedAt">>): Promise<void> {
    const updates: Partial<ExpiryRecord> = { ...record }
    
    // If updating the expiry date, automatically update status
    if (record.expiryDate) {
      const { status } = calculateExpiry(record.expiryDate)
      updates.status = status
    }

    await updateDocument(FIRESTORE_COLLECTIONS.RECORDS, updates, recordId)
  },

  /**
   * Renews an expiry cycle by appending the past expiry date to the history log
   * and updating the current record with the new expiry date, cost, and notes.
   */
  async renewRecord(
    recordId: string, 
    userId: string, 
    renewalData: { 
      previousExpiryDate: string, 
      newExpiryDate: string, 
      cost: number, 
      notes?: string 
    }
  ): Promise<void> {
    const record = await this.getRecord(recordId)
    if (!record) throw new Error("Record not found")

    const historyEntry = {
      previousExpiryDate: renewalData.previousExpiryDate,
      newExpiryDate: renewalData.newExpiryDate,
      cost: renewalData.cost,
      notes: renewalData.notes || "",
      renewedAt: new Date().toISOString(),
      renewedBy: userId
    }

    const updatedHistory = record.renewalHistory ? [...record.renewalHistory, historyEntry] : [historyEntry]
    const { status } = calculateExpiry(renewalData.newExpiryDate)

    await this.updateRecord(recordId, {
      expiryDate: renewalData.newExpiryDate,
      cost: renewalData.cost,
      status,
      renewalHistory: updatedHistory
    })
  },

  /**
   * Deletes an expiry record by ID.
   */
  async deleteRecord(recordId: string): Promise<void> {
    await deleteDocument(FIRESTORE_COLLECTIONS.RECORDS, recordId)
  },

  /**
   * Atomic batch deletion for multiple record IDs.
   */
  async deleteRecordsBatch(recordIds: string[]): Promise<void> {
    if (recordIds.length === 0) return
    const ops = recordIds.map(id => ({
      type: "delete" as const,
      collectionPath: FIRESTORE_COLLECTIONS.RECORDS,
      docId: id
    }))
    await executeBatch(ops)
  },

  /**
   * Subscribes to real-time changes in a user's records.
   * Auto-calculates status checks on the fly for any date shifts.
   */
  subscribeUserRecords(
    userId: string,
    onNext: (records: ExpiryRecord[]) => void,
    onError?: (error: Error) => void
  ) {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.RECORDS),
      where("userId", "==", userId)
    )

    return onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as ExpiryRecord
          // Recalculate status in real-time to reflect date changes relative to today
          const { status } = calculateExpiry(data.expiryDate, data.createdAt)
          return {
            ...data,
            id: docSnap.id,
            status // sync real-time engine state
          }
        })
        
        // Sort in-memory by expiryDate asc
        records.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
        
        onNext(records)
      },
      (error) => {
        if (onError) onError(error)
      }
    )
  },

  /**
   * Queries a paginated, filtered, and sorted list of expiry records for a specific user.
   */
  async listUserRecords(
    userId: string,
    options: {
      category?: string
      status?: string
      orderByField?: string
      orderDirection?: "asc" | "desc"
      pageSize?: number
      lastVisible?: QueryDocumentSnapshot<DocumentData>
    } = {}
  ) {
    const filters: QueryOptions["filters"] = [
      { field: "userId", operator: "==", value: userId }
    ]

    if (options.category) {
      filters.push({ field: "category", operator: "==", value: options.category })
    }

    if (options.status) {
      filters.push({ field: "status", operator: "==", value: options.status })
    }

    const sorts: QueryOptions["sorts"] = []
    if (options.orderByField) {
      sorts.push({ field: options.orderByField, direction: options.orderDirection })
    } else {
      // Default sort by expiry date
      sorts.push({ field: "expiryDate", direction: "asc" })
    }

    return queryCollectionPaged(FIRESTORE_COLLECTIONS.RECORDS, {
      filters,
      sorts,
      pageSize: options.pageSize || 10,
      lastVisible: options.lastVisible
    })
  }
}
