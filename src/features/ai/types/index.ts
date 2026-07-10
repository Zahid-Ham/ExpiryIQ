export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
}

export interface ChatSession {
  id: string
  userId: string
  messages: ChatMessage[]
  createdAt: string
}

export interface ModelPreferences {
  model: string
  temperature: number
  maxTokens: number
}

export interface CacheEntry {
  response: string
  expiresAt: number
}

export interface RAGDocumentContext {
  id: string
  title: string
  content: string
  score: number
  metadata?: Record<string, any>
}

export interface UsageStats {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface GroqChatResponse {
  answer: string
  usage?: UsageStats
}

export interface DailyUsageLog {
  date: string
  requestCount: number
  tokenCount: number
}
