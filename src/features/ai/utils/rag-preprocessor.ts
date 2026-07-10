import { ExpiryRecord } from "@/features/dashboard/types"
import { RAGDocumentContext } from "../types"

export class RAGPreprocessor {
  /**
   * Matches user query against records list to identify contextually relevant contracts
   */
  static matchContext(query: string, records: ExpiryRecord[]): RAGDocumentContext[] {
    const q = query.toLowerCase().trim()
    if (!q) return []

    const matches: RAGDocumentContext[] = []

    records.forEach(r => {
      let score = 0
      
      // Match title (high weight)
      if (r.title.toLowerCase().includes(q)) score += 5
      
      // Match category / vendor / department (medium weight)
      if (r.category.toLowerCase().includes(q)) score += 3
      if (r.vendor && r.vendor.toLowerCase().includes(q)) score += 3
      if (r.department && r.department.toLowerCase().includes(q)) score += 2
      
      // Match notes / tags (low weight)
      if (r.notes && r.notes.toLowerCase().includes(q)) score += 1
      if (r.tags && r.tags.some(t => t.toLowerCase().includes(q))) score += 1

      if (score > 0) {
        const content = `Contract: ${r.title}\nCategory: ${r.category}\nVendor: ${r.vendor || "N/A"}\nExpiry Date: ${r.expiryDate}\nDepartment: ${r.department || "N/A"}\nNotes: ${r.notes || ""}`
        matches.push({
          id: r.id || "",
          title: r.title,
          content,
          score,
          metadata: {
            category: r.category,
            vendor: r.vendor,
            expiryDate: r.expiryDate
          }
        })
      }
    })

    // Sort by descending score matches
    return matches.sort((a, b) => b.score - a.score)
  }

  /**
   * Builds context string list from top-matched documents
   */
  static getContextSnippets(query: string, records: ExpiryRecord[], limit: number = 3): string[] {
    return this.matchContext(query, records)
      .slice(0, limit)
      .map(doc => doc.content)
  }
}
