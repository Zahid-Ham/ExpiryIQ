import { ExpiryRecord } from "@/features/dashboard/types"

export class RecommendationsCache {
  /**
   * Generates a unique validation signature string from the records list
   */
  static generateHash(records: ExpiryRecord[]): string {
    if (records.length === 0) return "empty"
    const signature = records.map(r => `${r.id}_${r.owner || ""}_${r.attachments?.length || 0}`).join("|")
    return `reco_hash_${records.length}_${btoa(encodeURIComponent(signature)).slice(0, 32)}`
  }

  static getCachedRecommendations(hash: string): string | null {
    if (typeof window === "undefined") return null
    const storedHash = localStorage.getItem("expiry_iq_reco_hash")
    const storedContent = localStorage.getItem("expiry_iq_reco_content")

    if (storedHash === hash && storedContent) {
      return storedContent
    }
    return null
  }

  static setCachedRecommendations(hash: string, content: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem("expiry_iq_reco_hash", hash)
    localStorage.setItem("expiry_iq_reco_content", content)
  }

  static invalidate(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem("expiry_iq_reco_hash")
    localStorage.removeItem("expiry_iq_reco_content")
  }
}
