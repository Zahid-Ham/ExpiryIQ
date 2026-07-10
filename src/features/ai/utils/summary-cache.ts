import { ExpiryRecord } from "@/features/dashboard/types"

export class SummaryCache {
  /**
   * Generates a unique validation signature string from the records list
   */
  static generateHash(records: ExpiryRecord[]): string {
    if (records.length === 0) return "empty"
    // Create signature from ids, statuses, and last updated (or just sizes/dates)
    const signature = records.map(r => `${r.id}_${r.status}_${r.expiryDate}`).join("|")
    // Return simple base64 hash length key
    return `hash_${records.length}_${btoa(encodeURIComponent(signature)).slice(0, 32)}`
  }

  static getCachedSummary(hash: string): string | null {
    if (typeof window === "undefined") return null
    const storedHash = localStorage.getItem("expiry_iq_summary_hash")
    const storedContent = localStorage.getItem("expiry_iq_summary_content")

    if (storedHash === hash && storedContent) {
      return storedContent
    }
    return null
  }

  static setCachedSummary(hash: string, content: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem("expiry_iq_summary_hash", hash)
    localStorage.setItem("expiry_iq_summary_content", content)
  }

  static invalidate(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem("expiry_iq_summary_hash")
    localStorage.removeItem("expiry_iq_summary_content")
  }
}
