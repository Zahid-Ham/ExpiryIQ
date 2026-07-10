import { CacheEntry } from "../types"

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

export class ResponseCache {
  private static getCacheKey(prompt: string, model: string): string {
    // Generate a simple hash key representation
    return `ai_cache_${model}_${btoa(encodeURIComponent(prompt)).slice(0, 40)}`
  }

  static get(prompt: string, model: string): string | null {
    if (typeof window === "undefined") return null
    const key = this.getCacheKey(prompt, model)
    const stored = sessionStorage.getItem(key)
    
    if (!stored) return null

    try {
      const entry: CacheEntry = JSON.parse(stored)
      if (Date.now() > entry.expiresAt) {
        sessionStorage.removeItem(key) // Expired
        return null
      }
      return entry.response
    } catch {
      return null
    }
  }

  static set(prompt: string, model: string, response: string, ttlMs: number = DEFAULT_TTL_MS): void {
    if (typeof window === "undefined") return
    const key = this.getCacheKey(prompt, model)
    const entry: CacheEntry = {
      response,
      expiresAt: Date.now() + ttlMs
    }
    sessionStorage.setItem(key, JSON.stringify(entry))
  }

  static clear(): void {
    if (typeof window === "undefined") return
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith("ai_cache_")) {
        sessionStorage.removeItem(key)
      }
    })
  }
}
