"use client"

import * as React from "react"
import { ChatMessage } from "../types"
import { GroqService } from "../services/groq-service"
import { SYSTEM_PROMPTS, buildRAGPrompt } from "../prompts/templates"
import { RAGPreprocessor } from "../utils/rag-preprocessor"
import { RecordsService } from "@/features/dashboard/services/records-service"
import { ExpiryRecord } from "@/features/dashboard/types"
import { useAuth } from "@/features/auth/hooks/use-auth"
import toast from "react-hot-toast"

export function useAIChat() {
  const { user } = useAuth()
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [records, setRecords] = React.useState<ExpiryRecord[]>([])

  // Load user records for context pre-processing (RAG)
  React.useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = RecordsService.subscribeUserRecords(
      user.uid,
      (data) => setRecords(data),
      (err) => console.error("RAG context query failure:", err)
    )
    return () => unsubscribe()
  }, [user?.uid])

  // Load chat history from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("expiry_iq_ai_messages")
      if (stored) {
        try {
          setMessages(JSON.parse(stored))
        } catch {
          // Reset
        }
      }
    }
  }, [])

  // Persist messages to localStorage
  const saveMessages = (msgs: ChatMessage[]) => {
    setMessages(msgs)
    if (typeof window !== "undefined") {
      localStorage.setItem("expiry_iq_ai_messages", JSON.stringify(msgs))
    }
  }

  // Send a message
  const sendMessage = React.useCallback(async (content: string, onStreamChunk?: (text: string) => void) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...messages, userMessage]
    saveMessages(updatedMessages)
    setIsLoading(true)

    try {
      // 1. Context matching preprocessor (RAG) - Limit to top 3 relevant records
      const contextSnippets = RAGPreprocessor.getContextSnippets(content, records, 3)
      
      // 2. Decorate query using templates
      const prompt = buildRAGPrompt(content, contextSnippets)

      // 3. Sliding Window History: only send user's prompt + sliding window context if needed
      // To optimize for free tier and minimize tokens, we never resend the entire conversation.
      const reply = await GroqService.completeChat(
        prompt,
        SYSTEM_PROMPTS.GENERAL_ASSISTANT
      )

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString()
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      saveMessages(finalMessages)
      
      // Callback for custom text chunk scrolling effect
      if (onStreamChunk) {
        onStreamChunk(reply)
      }
    } catch (err) {
      console.error(err)
      const errMsg = err instanceof Error ? err.message : "Failed to obtain AI response."
      toast.error(errMsg)
      
      const systemWarning: ChatMessage = {
        id: `msg_${Date.now()}_system`,
        role: "system",
        content: `Error: ${errMsg}`,
        timestamp: new Date().toISOString()
      }
      saveMessages([...updatedMessages, systemWarning])
    } finally {
      setIsLoading(false)
    }
  }, [records, messages])

  const clearSession = React.useCallback(() => {
    setMessages([])
    if (typeof window !== "undefined") {
      localStorage.removeItem("expiry_iq_ai_messages")
    }
    toast.success("AI Chat session cleared")
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    clearSession
  }
}
