import { ResponseCache } from "../cache/response-cache"
import { ModelPreferences, GroqChatResponse, DailyUsageLog } from "../types"
import { buildRiskAnalysisPrompt } from "../prompts/templates"

const INTERNAL_API_URL = "/api/ai/chat"
const DEFAULT_MODEL = "llama-3.3-70b-versatile"
const REQUEST_TIMEOUT_MS = 15000 // 15 seconds timeout
const MAX_RETRIES = 3

export class GroqService {
  /**
   * Tracks and increments daily request counts and token metrics in localStorage
   */
  private static trackDailyUsage(tokensUsed: number = 0) {
    if (typeof window === "undefined") return
    const today = new Date().toLocaleDateString()
    const stored = localStorage.getItem("expiry_iq_ai_usage")
    
    let log: DailyUsageLog = { date: today, requestCount: 0, tokenCount: 0 }
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DailyUsageLog
        if (parsed.date === today) {
          log = parsed
        }
      } catch {
        // Reset
      }
    }

    log.requestCount += 1
    log.tokenCount += tokensUsed
    localStorage.setItem("expiry_iq_ai_usage", JSON.stringify(log))
  }

  /**
   * Returns current daily usage log
   */
  static getDailyUsage(): DailyUsageLog {
    if (typeof window === "undefined") {
      return { date: "", requestCount: 0, tokenCount: 0 }
    }
    const today = new Date().toLocaleDateString()
    const stored = localStorage.getItem("expiry_iq_ai_usage")
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DailyUsageLog
        if (parsed.date === today) return parsed
      } catch {
        // Fallback
      }
    }
    return { date: today, requestCount: 0, tokenCount: 0 }
  }

  /**
   * Execute fetch completion request with custom timeout handling and retry strategy
   */
  static async completeChat(
    prompt: string,
    systemPrompt?: string,
    options?: Partial<ModelPreferences>
  ): Promise<string> {
    const model = options?.model || DEFAULT_MODEL
    
    // 1. Caching Repeated Requests validation
    const cached = ResponseCache.get(prompt, model)
    if (cached) {
      return cached
    }

    const messages = []
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    messages.push({ role: "user", content: prompt })

    let attempt = 0
    let delay = 1000 // Initial backoff delay

    while (attempt < MAX_RETRIES) {
      attempt++
      
      // Setup Timeout Controller
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      try {
        const res = await fetch(INTERNAL_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: options?.temperature ?? 0.2,
            max_tokens: options?.maxTokens ?? 1024
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData?.error?.message || `Server API responded with code ${res.status}`)
        }

        const data = (await res.json()) as GroqChatResponse
        const answer = data.answer || ""

        // Cache completed repeat query response
        if (answer) {
          ResponseCache.set(prompt, model, answer)
        }

        // Daily requests and Token Usage Tracking
        this.trackDailyUsage(data.usage?.totalTokens || 0)

        return answer
      } catch (err) {
        clearTimeout(timeoutId)
        
        // Timeout or Network Failure Retry backoff
        const isTimeout = err instanceof DOMException && err.name === "AbortError"
        if (attempt >= MAX_RETRIES) {
          throw new Error(
            isTimeout 
              ? "AI request timed out. Please check your connection and try again." 
              : err instanceof Error ? err.message : "AI completion request failed."
          )
        }

        // Exponential backoff wait
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // Double the wait duration
      }
    }

    throw new Error("Failed to complete request after maximum retry attempts.")
  }

  // ==========================================
  // Reusable Helper Methods
  // ==========================================

  /**
   * Helper: Analyzes contract profiles for risk evaluation parameters
   */
  static async analyzeContractRisk(contractDetails: Record<string, any>): Promise<string> {
    const prompt = buildRiskAnalysisPrompt(contractDetails)
    const systemPrompt = "You are a professional legal auditor. Provide structured contract risk reports."
    return this.completeChat(prompt, systemPrompt, { temperature: 0.1 })
  }

  /**
   * Helper: Summarizes contract contents or notes
   */
  static async summarizeContract(title: string, notes: string): Promise<string> {
    const prompt = `Summarize the key conditions and compliance points for the following contract:
Title: ${title}
Notes: ${notes}`
    const systemPrompt = "Provide a high-level executive summary under 3 sentences."
    return this.completeChat(prompt, systemPrompt, { temperature: 0.3, maxTokens: 256 })
  }
}
