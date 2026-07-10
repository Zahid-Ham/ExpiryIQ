import { FilterState } from "@/features/dashboard/components/advanced-filters-drawer"
import { ExpiryRecord } from "@/features/dashboard/types"
import { PromptLibrary } from "../prompts/prompt-library"
import { GroqService } from "../services/groq-service"

export interface ParsedFilters {
  status: "all" | "active" | "expiring_soon" | "expired"
  category: string
  priority: "all" | "low" | "medium" | "high" | "critical"
  department: string
  searchQuery: string
}

export class NLPParser {
  /**
   * Fast client-side keyword pattern matching to avoid Groq API calls entirely
   */
  static parseClientSide(query: string, records: ExpiryRecord[]): ParsedFilters | null {
    const q = query.toLowerCase().trim()
    if (!q) return null

    // Extract categories, priorities, departments from records to build dynamic match arrays
    const categories = Array.from(new Set(records.map(r => r.category.toLowerCase())))
    const departments = Array.from(new Set(records.map(r => r.department?.toLowerCase() || ""))).filter(Boolean)

    let status: ParsedFilters["status"] = "all"
    let category = ""
    let priority: ParsedFilters["priority"] = "all"
    let department = ""
    let searchQuery = ""

    let matched = false

    // 1. Status Matchers
    if (q.includes("already expired") || q.includes("is expired") || q.match(/\bexpired\b/)) {
      status = "expired"
      matched = true
    } else if (q.includes("expiring soon") || q.includes("expiring this week") || q.includes("expire soon")) {
      status = "expiring_soon"
      matched = true
    } else if (q.includes("active") || q.includes("current") || q.includes("valid")) {
      status = "active"
      matched = true
    }

    // 2. Category Matchers
    for (const cat of categories) {
      if (q.includes(cat) || q.includes(cat + "s")) {
        category = cat
        matched = true
        break
      }
    }

    // 3. Priority Matchers
    const priorities: ParsedFilters["priority"][] = ["low", "medium", "high", "critical"]
    for (const prio of priorities) {
      if (q.includes(prio)) {
        priority = prio
        matched = true
        break
      }
    }

    // 4. Department Matchers
    for (const dept of departments) {
      if (q.includes(dept) || q.includes(`owned by ${dept}`) || q.includes(`in ${dept}`)) {
        department = dept
        matched = true
        break
      }
    }

    if (matched) {
      return { status, category, priority, department, searchQuery }
    }

    return null
  }

  /**
   * Fallback to Groq completions to translate complex query intents into structured filter parameters
   */
  static async parseWithAI(query: string, availableCategories: string[]): Promise<ParsedFilters> {
    try {
      const prompt = PromptLibrary.getNaturalLanguageSearchPrompt(query, availableCategories)
      const systemPrompt = "You are a database query compiler. Return ONLY valid JSON blocks."
      
      const responseText = await GroqService.completeChat(prompt, systemPrompt, {
        temperature: 0.05
      })

      // Strip markdown fences
      const cleanJSON = responseText.replace(/```json/gi, "").replace(/```/g, "").trim()
      const data = JSON.parse(cleanJSON)

      const statusMap: Record<string, ParsedFilters["status"]> = {
        true: "expired",
        false: "active",
        null: "all"
      }

      return {
        status: statusMap[String(data.isExpired)] || "all",
        category: data.category || "",
        priority: data.priority || "all",
        department: "", // Optional fallback
        searchQuery: data.vendor || ""
      }
    } catch (err) {
      console.error("NLP AI Parsing error:", err)
      // Return empty default state
      return { status: "all", category: "", priority: "all", department: "", searchQuery: "" }
    }
  }
}
