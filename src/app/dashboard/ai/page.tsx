"use client"

import * as React from "react"
import { DashboardLayout } from "@/features/dashboard/layouts/dashboard-layout"
import { PageHeader } from "@/features/dashboard/components/page-header"
import { Button } from "@/components/ui/button"
import { useAIChat } from "@/features/ai/hooks/use-ai-chat"
import { GroqService } from "@/features/ai/services/groq-service"
import { RecordsService } from "@/features/dashboard/services/records-service"
import { ExpiryRecord } from "@/features/dashboard/types"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { calculateExpiry } from "@/features/dashboard/utils/expiry-engine"
import { SummaryCache } from "@/features/ai/utils/summary-cache"
import { RiskCache } from "@/features/ai/utils/risk-cache"
import { RecommendationsCache } from "@/features/ai/utils/recommendations-cache"
import { useRouter } from "next/navigation"
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  CornerDownLeft, 
  HelpCircle,
  Cpu,
  FileText,
  AlertTriangle,
  RefreshCw,
  Info,
  ShieldAlert,
  Lightbulb,
  ArrowRight,
  ShieldCheck
} from "lucide-react"
import toast from "react-hot-toast"

const SUGGESTIONS = [
  "Analyze my contract renewal risks.",
  "Which software license has the highest cost?",
  "Draft a Slack reminder message for expired contracts.",
  "Show me the compliance report for my digital domains."
]

interface RecommendationCard {
  id: string
  title: string
  impact: "High" | "Medium" | "Low"
  description: string
  actionLabel: string
  url: string
}

export default function AIChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Tab control: chat, summary, risk, recommendations
  const [activeTab, setActiveTab] = React.useState<"chat" | "summary" | "risk" | "recommendations">("chat")
  
  // Chat Hook
  const { messages, isLoading, sendMessage, clearSession } = useAIChat()
  const [input, setInput] = React.useState("")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [streamingText, setStreamingText] = React.useState("")
  const [streamingMsgId, setStreamingMsgId] = React.useState<string | null>(null)

  // Records & Reports states
  const [records, setRecords] = React.useState<ExpiryRecord[]>([])
  const [execSummary, setExecSummary] = React.useState<string | null>(null)
  const [riskReport, setRiskReport] = React.useState<string | null>(null)
  const [recommendations, setRecommendations] = React.useState<RecommendationCard[]>([])
  
  const [isGeneratingSummary, setIsGeneratingSummary] = React.useState(false)
  const [isGeneratingRisk, setIsGeneratingRisk] = React.useState(false)
  const [isGeneratingReco, setIsGeneratingReco] = React.useState(false)
  const [dailyUsage, setDailyUsage] = React.useState({ requestCount: 0, tokenCount: 0 })

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Subscribe to records
  React.useEffect(() => {
    if (!user?.uid) return
    const unsubscribe = RecordsService.subscribeUserRecords(
      user.uid,
      (data) => setRecords(data),
      (err) => console.error("Error loading records:", err)
    )
    return () => unsubscribe()
  }, [user?.uid])

  const updateUsageMetrics = () => {
    const usage = GroqService.getDailyUsage()
    setDailyUsage({
      requestCount: usage.requestCount,
      tokenCount: usage.tokenCount
    })
  }

  React.useEffect(() => {
    updateUsageMetrics()
  }, [messages, execSummary, riskReport, recommendations])

  // Check cached documents whenever records list changes
  React.useEffect(() => {
    if (records.length === 0) return
    
    // 1. Audit Summary Cache
    const sumHash = SummaryCache.generateHash(records)
    const cachedSum = SummaryCache.getCachedSummary(sumHash)
    setExecSummary(cachedSum || null)

    // 2. Risk Analysis Cache
    const riskHash = RiskCache.generateHash(records)
    const cachedRisk = RiskCache.getCachedRisk(riskHash)
    setRiskReport(cachedRisk || null)

    // 3. AI Recommendations Cache
    const recoHash = RecommendationsCache.generateHash(records)
    const cachedReco = RecommendationsCache.getCachedRecommendations(recoHash)
    if (cachedReco) {
      try {
        setRecommendations(JSON.parse(cachedReco))
      } catch {
        setRecommendations([])
      }
    } else {
      setRecommendations([])
    }
  }, [records])

  // Scroll bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading, streamingText])

  // Generate Executive Summary
  const generateExecutiveSummary = async () => {
    if (records.length === 0) {
      toast.error("No contracts found to analyze.")
      return
    }

    setIsGeneratingSummary(true)
    const toastId = toast.loading("AI is profiling your contracts database...")

    try {
      const totalCount = records.length
      const criticalExpiries: string[] = []
      const upcomingRenewals: string[] = []
      const departmentRisks: Record<string, number> = {}
      const categoryCounts: Record<string, number> = {}
      const missingInfo: string[] = []

      records.forEach(r => {
        const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
        
        if (remainingDays < 7) {
          criticalExpiries.push(r.title)
        } else if (remainingDays <= 30) {
          upcomingRenewals.push(r.title)
        }

        if (remainingDays <= 30) {
          const dept = r.department || "Unassigned"
          departmentRisks[dept] = (departmentRisks[dept] || 0) + 1
        }

        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1

        const missingFields = []
        if (!r.cost) missingFields.push("cost")
        if (!r.vendor) missingFields.push("vendor")
        if (!r.owner) missingFields.push("owner")
        if (!r.attachments || r.attachments.length === 0) missingFields.push("documents")
        
        if (missingFields.length > 0) {
          missingInfo.push(`${r.title} (missing: ${missingFields.join(", ")})`)
        }
      })

      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name, count]) => `${name} (${count})`)

      const topRiskDepts = Object.entries(departmentRisks)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name, count]) => `${name} (${count} at risk)`)

      const prompt = `Generate a concise, professional Executive Summary for a contract registry manager based on the database statistics below. 

Format the response into these exact sections:
1. **Registry Overview** (Total records, category mix)
2. **Critical Timeline Warnings** (Highlight critical expiries and upcoming renewals)
3. **Risk Exposure Profile** (Highest risk departments)
4. **Actionable Recommendations** (3 brief bullet points)
5. **Data Completeness Issues** (Purge list of records missing costs, owners, or attachments)

---
Database Statistics:
- Total Records: ${totalCount}
- Critical Expiries (<7 days): ${criticalExpiries.length > 0 ? criticalExpiries.join(", ") : "None"}
- Upcoming Renewals (<30 days): ${upcomingRenewals.length > 0 ? upcomingRenewals.join(", ") : "None"}
- Highest Risk Departments: ${topRiskDepts.length > 0 ? topRiskDepts.join(", ") : "None"}
- Most Common Categories: ${topCategories.join(", ")}
- Missing Information Logs: ${missingInfo.slice(0, 4).join(" | ")}
---

Keep it concise and business-friendly.`

      const responseText = await GroqService.completeChat(prompt, "You are a senior auditor.", { temperature: 0.15 })
      setExecSummary(responseText)

      const hash = SummaryCache.generateHash(records)
      SummaryCache.setCachedSummary(hash, responseText)

      toast.dismiss(toastId)
      toast.success("Executive Summary generated!")
    } catch (err) {
      console.error(err)
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "Failed to generate executive summary.")
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  // Generate AI Risk Analysis Report
  const generateRiskAnalysis = async () => {
    if (records.length === 0) {
      toast.error("No contracts found to analyze.")
      return
    }

    setIsGeneratingRisk(true)
    const toastId = toast.loading("AI is conducting compliance vulnerability scans...")

    try {
      const expiredList: string[] = []
      const highPriorityList: string[] = []
      const deptExpiries: Record<string, number> = {}
      const missingReminders: string[] = []
      const missingOwners: string[] = []
      
      const titles = records.map(r => r.title.toLowerCase().trim())
      const duplicates = records.filter((r, idx) => titles.indexOf(r.title.toLowerCase().trim()) !== idx).map(r => r.title)

      records.forEach(r => {
        const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
        
        if (remainingDays < 0) {
          expiredList.push(r.title)
          const dept = r.department || "Unassigned"
          deptExpiries[dept] = (deptExpiries[dept] || 0) + 1
        }

        if (r.priority === "high" || r.priority === "critical") {
          highPriorityList.push(r.title)
        }

        if (!r.reminderDays || r.reminderDays.length === 0) {
          missingReminders.push(r.title)
        }

        if (!r.owner) {
          missingOwners.push(r.title)
        }
      })

      const topExpiriesDepts = Object.entries(deptExpiries)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => `${name} (${count} expired)`)

      const prompt = `Conduct a comprehensive contract compliance risk review for the corporate database parameters below.

Your analysis MUST outline:
1. **Corporate Risk Score**: Assign a quantitative score (0-100) where 100 is maximum vulnerability, and specify corresponding **Risk Level** (Low/Medium/High/Critical).
2. **Expired & Priority Liabilities**: Review expired titles and high/critical priorities.
3. **Department Exposure Summary**: Detail teams with highest expired concentrations.
4. **Vulnerabilities Profile**: Summarize gaps from missing reminders and missing owners.
5. **Database Integrity Gaps**: Detail risk from duplicate records: ${duplicates.length > 0 ? duplicates.join(", ") : "None"}.
6. **Mitigation Recommendations & Action Plan**: Outline structured recommendations using executive-level language.

---
Vulnerability Parameters:
- Expired Profiles: ${expiredList.length > 0 ? expiredList.join(", ") : "None"}
- High/Critical Priority Profiles: ${highPriorityList.join(", ")}
- Expired Counts by Department: ${topExpiriesDepts.join(" | ") || "None"}
- Missing Reminder Settings: ${missingReminders.slice(0, 3).join(", ") || "None"}
- Missing Profile Owners: ${missingOwners.slice(0, 3).join(", ") || "None"}
- Duplicate Titles Detected: ${duplicates.length > 0 ? duplicates.join(", ") : "None"}
---

Format using professional executive headings and bullet lists. Keep it concise.`

      const responseText = await GroqService.completeChat(prompt, "You are a chief risk officer (CRO). Provide formal compliance assessments.", {
        temperature: 0.1
      })

      setRiskReport(responseText)

      const hash = RiskCache.generateHash(records)
      RiskCache.setCachedRisk(hash, responseText)

      toast.dismiss(toastId)
      toast.success("Risk Analysis Report generated!")
    } catch (err) {
      console.error(err)
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "Failed to generate risk analysis.")
    } finally {
      setIsGeneratingRisk(false)
    }
  }

  // Generate AI Recommendations Cards using Groq JSON Mode
  const generateRecommendations = async () => {
    if (records.length === 0) {
      toast.error("No records found to recommend actions.")
      return
    }

    setIsGeneratingReco(true)
    const toastId = toast.loading("AI is mapping proactive recommendations...")

    try {
      const expiringSoon = records.filter(r => {
        const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
        return remainingDays >= 0 && remainingDays <= 30
      })
      const missingOwners = records.filter(r => !r.owner)
      const missingReminders = records.filter(r => !r.reminderDays || r.reminderDays.length === 0)
      const missingDocs = records.filter(r => !r.attachments || r.attachments.length === 0)
      
      // Find Duplicate Vendors
      const vendors = records.map(r => r.vendor?.trim()).filter(Boolean) as string[]
      const duplicateVendors = Array.from(new Set(vendors.filter((v, idx) => vendors.indexOf(v) !== idx)))

      const prompt = `Analyze these contract registry gaps and generate exactly 3 highly actionable, executive-ready recommendation items.
Format the output as a valid JSON array of objects fitting this schema:
[
  {
    "id": "uniqueString",
    "title": "Actionable Title",
    "impact": "High" | "Medium" | "Low",
    "description": "Professional 2-sentence description outlining the vulnerability and impact.",
    "actionLabel": "Button Label",
    "url": "/dashboard/records?targetFilters=value"
  }
]

Vulnerabilities compiling:
- Upcoming Expiries: ${expiringSoon.length} items (Titles: ${expiringSoon.slice(0, 3).map(r => r.title).join(", ")})
- Missing Owner assignments: ${missingOwners.length} items
- Missing Reminder Settings: ${missingReminders.length} items
- Documents missing Attachments: ${missingDocs.length} items
- Duplicate Vendors detected: ${duplicateVendors.slice(0, 2).join(", ")}

Generate clean JSON only.`

      const systemPrompt = "You are a database system compliance consultant. Return ONLY a valid JSON array of recommendation cards."
      
      const responseText = await GroqService.completeChat(prompt, systemPrompt, {
        temperature: 0.1
      })

      const cleanJSON = responseText.replace(/```json/gi, "").replace(/```/g, "").trim()
      const parsed = JSON.parse(cleanJSON) as RecommendationCard[]

      setRecommendations(parsed)

      // Save to cache
      const hash = RecommendationsCache.generateHash(records)
      RecommendationsCache.setCachedRecommendations(hash, JSON.stringify(parsed))

      toast.dismiss(toastId)
      toast.success("AI Recommendations populated!")
    } catch (err) {
      console.error(err)
      toast.dismiss(toastId)
      toast.error("Failed to parse recommendation JSON structures.")
    } finally {
      setIsGeneratingReco(false)
    }
  }

  // Markdown Parser
  const renderMarkdown = (text: string) => {
    // Process tables
    if (text.includes("|")) {
      const lines = text.split("\n")
      const tableLines = lines.filter(l => l.trim().startsWith("|"))
      if (tableLines.length >= 2) {
        const rows = tableLines.map(line => {
          return line.split("|").map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        })
        const headers = rows[0]
        const body = rows.slice(2)

        return (
          <div className="overflow-x-auto my-3 border border-border rounded-lg bg-muted/10">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {headers.map((h, i) => (
                    <th key={i} className="p-2.5 font-extrabold text-foreground">{h.replace(/\*\*/g, "")}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {body.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-muted/10">
                    {row.map((cell, cIdx) => {
                      const isBold = cell.startsWith("**") && cell.endsWith("**")
                      const val = cell.replace(/\*\*/g, "")
                      return (
                        <td key={cIdx} className="p-2.5 font-semibold text-muted-foreground">
                          {isBold ? <strong className="text-foreground">{val}</strong> : val}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    }

    // Process lists and headers
    return text.split("\n").map((line, idx) => {
      let trimmed = line.trim()
      
      if (trimmed.startsWith("###")) {
        return <h3 key={idx} className="text-sm font-extrabold text-foreground mt-4 mb-2">{trimmed.slice(3).trim()}</h3>
      }
      if (trimmed.startsWith("####")) {
        return <h4 key={idx} className="text-xs font-bold text-foreground mt-3 mb-1.5">{trimmed.slice(4).trim()}</h4>
      }
      if (trimmed.startsWith("##") || trimmed.startsWith("1.") || trimmed.startsWith("2.") || trimmed.startsWith("3.") || trimmed.startsWith("4.") || trimmed.startsWith("5.") || trimmed.startsWith("6.")) {
        return <h4 key={idx} className="text-xs font-extrabold text-foreground mt-4 mb-2 uppercase tracking-wide">{trimmed.replace(/\*\*/g, "")}</h4>
      }

      if (trimmed.startsWith("```")) {
        return null
      }

      if (trimmed.includes("`")) {
        const parts = trimmed.split("`")
        return (
          <p key={idx} className="text-xs font-medium leading-relaxed my-1.5 text-muted-foreground">
            {parts.map((p, i) => i % 2 === 1 ? <code key={i} className="bg-muted px-1.5 py-0.5 rounded border border-border text-foreground font-mono font-bold text-[10px]">{p}</code> : p)}
          </p>
        )
      }

      if (trimmed.startsWith("•") || trimmed.startsWith("*") || trimmed.startsWith("-")) {
        const content = trimmed.replace(/^[\s•*-]+/, "").trim()
        const parts = content.split("`")
        return (
          <li key={idx} className="ml-4 text-xs font-semibold text-muted-foreground list-disc my-1">
            {parts.map((p, i) => i % 2 === 1 ? <code key={i} className="bg-muted px-1.5 py-0.5 rounded border border-border text-foreground font-mono font-bold text-[10px]">{p}</code> : p)}
          </li>
        )
      }

      if (trimmed.startsWith(">")) {
        return (
          <blockquote key={idx} className="border-l-2 border-primary bg-primary/5 px-3 py-2 rounded-r-lg my-2 text-[10px] font-bold text-primary flex items-start gap-1">
            <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{trimmed.slice(1).replace(/\[!NOTE\]/g, "").trim()}</span>
          </blockquote>
        )
      }

      if (!trimmed) return <div key={idx} className="h-2" />

      return (
        <p key={idx} className="text-xs font-semibold leading-relaxed my-1.5 text-muted-foreground">
          {trimmed.split("**").map((p, i) => i % 2 === 1 ? <strong key={i} className="text-foreground">{p}</strong> : p)}
        </p>
      )
    })
  }

  // Copy text to clipboard
  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedId(null), 1500)
  }

  // Handle message send
  const handleSend = async (textToSend?: string) => {
    const finalQuery = textToSend || input
    if (!finalQuery.trim()) return

    if (!textToSend) setInput("")
    setStreamingText("")
    setStreamingMsgId(null)

    await sendMessage(finalQuery, (completedText) => {
      const targetId = `stream_${Date.now()}`
      setStreamingMsgId(targetId)
      
      let displayedText = ""
      let charIdx = 0
      
      const interval = setInterval(() => {
        if (charIdx < completedText.length) {
          displayedText += completedText[charIdx]
          setStreamingText(displayedText)
          charIdx += 4
        } else {
          clearInterval(interval)
          setStreamingMsgId(null)
          setStreamingText("")
          updateUsageMetrics()
        }
      }, 15)
    })
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="AI Assistant Workspace"
        description="Interact with the smart contract copilot or generate automated executive compliance summaries."
        actions={
          <div className="flex items-center gap-3 select-none">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold bg-muted/20 border border-border px-3 py-1.5 rounded-lg">
              <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Usage Today: <strong>{dailyUsage.requestCount}</strong> reqs / <strong>{dailyUsage.tokenCount}</strong> tokens</span>
            </div>
          </div>
        }
      />

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-border/80 max-w-4xl mx-auto mt-6 shrink-0">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "chat" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          AI Chat Copilot
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "summary" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Executive Audit Summary
        </button>
        <button
          onClick={() => setActiveTab("risk")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "risk" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          AI Risk Analysis
        </button>
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "recommendations" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          AI Recommendations
        </button>
      </div>

      <div className="max-w-4xl mx-auto mt-4 flex flex-col h-[calc(100vh-270px)] min-h-[440px] bg-card border border-border rounded-xl overflow-hidden select-none text-left">
        
        {activeTab === "chat" && (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-border/60 bg-muted/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
                <span className="text-xs font-bold text-foreground">Groq Llama-3 Enterprise Copilot</span>
                <span className="text-[9px] font-extrabold uppercase bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.2 rounded-md">RAG Context Engine</span>
              </div>

              <Button
                onClick={clearSession}
                variant="ghost"
                className="h-8 text-xs font-bold gap-1 cursor-pointer text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 px-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Chat</span>
              </Button>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="py-20 text-center text-xs text-muted-foreground/80 font-bold select-none flex flex-col items-center justify-center gap-2">
                  <Sparkles className="h-7 w-7 text-primary/50" />
                  <span>No active chat messages. Choose a query suggestion below.</span>
                </div>
              )}

              {messages.map((msg, index) => {
                const isUser = msg.role === "user"
                const isSystem = msg.role === "system"
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{msg.content}</span>
                      </div>
                    </div>
                  )
                }

                const isLastMsg = index === messages.length - 1
                const isStreamingThis = !isUser && isLastMsg && streamingMsgId !== null
                const contentToRender = isStreamingThis ? streamingText : msg.content

                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-3`}>
                    {!isUser && (
                      <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    
                    <div className="group relative max-w-[85%] min-w-[50px]">
                      <div className={`p-3.5 rounded-xl border text-xs font-semibold ${
                        isUser 
                          ? "bg-primary text-white border-primary" 
                          : "bg-muted/10 border-border/80 text-foreground"
                      }`}>
                        {isUser ? (
                          <p className="leading-relaxed font-bold whitespace-pre-wrap">{contentToRender}</p>
                        ) : (
                          <div className="space-y-1">
                            {renderMarkdown(contentToRender)}
                          </div>
                        )}
                      </div>

                      {!isUser && contentToRender && (
                        <button
                          onClick={() => handleCopy(msg.id, contentToRender)}
                          className="absolute -right-7 top-2 p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {isLoading && streamingMsgId === null && (
                <div className="flex justify-start items-center gap-3 animate-pulse">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="px-3.5 py-3 rounded-xl border border-border/80 bg-muted/10 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-100" />
                    <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-200" />
                    <span className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions Panel */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 border-t border-border/60 bg-muted/5 shrink-0">
                <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5 text-left">Suggested queries</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug)}
                      className="px-2.5 py-1.5 rounded-lg border border-border/80 bg-card text-[10px] font-bold text-foreground hover:border-primary/45 hover:bg-muted/10 cursor-pointer transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-border bg-card shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2 border border-border focus-within:border-primary/50 bg-background/50 rounded-xl px-3 py-1.5 transition-all"
              >
                <input
                  type="text"
                  placeholder="Ask Copilot about risk levels, expenditures, or write summaries..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-xs font-semibold text-foreground placeholder-muted-foreground outline-none border-none h-8 disabled:opacity-50"
                />
                
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-extrabold bg-muted border border-border px-1.5 py-0.5 rounded text-muted-foreground select-none">
                  <CornerDownLeft className="h-2.5 w-2.5" />
                  <span>Enter</span>
                </kbd>

                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="h-8 w-8 p-0 bg-primary text-white hover:bg-primary/95 shrink-0 rounded-lg cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </>
        )}

        {activeTab === "summary" && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                  <span>Executive Audit Summary</span>
                </h3>
                <p className="text-[10px] font-semibold text-muted-foreground">Auto-generates structured portfolio analysis. Re-runs only when database records change.</p>
              </div>

              <Button
                onClick={generateExecutiveSummary}
                disabled={isGeneratingSummary || records.length === 0}
                className="bg-primary text-white hover:bg-primary/95 text-xs font-extrabold px-4 h-9 cursor-pointer gap-1.5 rounded-lg shadow-sm shrink-0"
              >
                {isGeneratingSummary ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{execSummary ? "Regenerate Summary" : "Generate Summary"}</span>
                  </>
                )}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 border border-border bg-muted/5 rounded-xl text-left">
                <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Total Records</p>
                <p className="text-xl font-extrabold text-foreground mt-0.5">{records.length}</p>
              </div>
              <div className="p-3 border border-border bg-muted/5 rounded-xl text-left">
                <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Active Categories</p>
                <p className="text-xl font-extrabold text-foreground mt-0.5">
                  {Array.from(new Set(records.map(r => r.category))).length}
                </p>
              </div>
              <div className="p-3 border border-border bg-muted/5 rounded-xl text-left">
                <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">At Critical Risk</p>
                <p className={`text-xl font-extrabold mt-0.5 ${
                  records.some(r => calculateExpiry(r.expiryDate, r.createdAt).remainingDays < 7) ? "text-rose-500" : "text-foreground"
                }`}>
                  {records.filter(r => calculateExpiry(r.expiryDate, r.createdAt).remainingDays < 7).length}
                </p>
              </div>
              <div className="p-3 border border-border bg-muted/5 rounded-xl text-left">
                <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Needs Renewals</p>
                <p className="text-xl font-extrabold text-foreground mt-0.5">
                  {records.filter(r => {
                    const days = calculateExpiry(r.expiryDate, r.createdAt).remainingDays
                    return days >= 0 && days <= 30
                  }).length}
                </p>
              </div>
            </div>

            <div className="border border-border/80 bg-muted/10 p-5 rounded-xl">
              {execSummary ? (
                <div className="space-y-2">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => handleCopy("exec_summary", execSummary)}
                      className="px-2 py-1 rounded-lg border border-border bg-card text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === "exec_summary" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>Copy Report</span>
                    </button>
                  </div>
                  <div className="text-left select-text">
                    {renderMarkdown(execSummary)}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-muted-foreground/80 font-bold flex flex-col items-center justify-center gap-2">
                  <Info className="h-7 w-7 text-muted-foreground/45" />
                  <span>No Executive Summary generated yet. Click the &quot;Generate Summary&quot; button above.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "risk" && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
                  <span>AI Risk & Compliance Scan</span>
                </h3>
                <p className="text-[10px] font-semibold text-muted-foreground">Scans registry vulnerabilities, assigns a corporate risk score, and generates action plans.</p>
              </div>

              <Button
                onClick={generateRiskAnalysis}
                disabled={isGeneratingRisk || records.length === 0}
                className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-extrabold px-4 h-9 cursor-pointer gap-1.5 rounded-lg shadow-sm shrink-0"
              >
                {isGeneratingRisk ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Scanning Gaps...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>{riskReport ? "Re-Run Risk Scan" : "Run Risk Scan"}</span>
                  </>
                )}
              </Button>
            </div>

            {/* Vulnerability Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 border border-border bg-muted/5 rounded-xl text-left">
                <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Expired Profiles</p>
                <p className={`text-xl font-extrabold mt-0.5 ${
                  records.some(r => calculateExpiry(r.expiryDate, r.createdAt).remainingDays < 0) ? "text-rose-500" : "text-foreground"
                }`}>
                  {records.filter(r => calculateExpiry(r.expiryDate, r.createdAt).remainingDays < 0).length}
                </p>
              </div>
              <div className="p-3 border border-border bg-muted/5 rounded-xl text-left">
                <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Missing Reminders</p>
                <p className="text-xl font-extrabold text-foreground mt-0.5">
                  {records.filter(r => !r.reminderDays || r.reminderDays.length === 0).length}
                </p>
              </div>
              <div className="p-3 border border-border bg-muted/5 rounded-xl text-left">
                <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Missing Owners</p>
                <p className="text-xl font-extrabold text-foreground mt-0.5">
                  {records.filter(r => !r.owner).length}
                </p>
              </div>
              <div className="p-3 border border-border bg-muted/5 rounded-xl text-left">
                <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Duplicate Records</p>
                <p className="text-xl font-extrabold text-foreground mt-0.5">
                  {(() => {
                    const titles = records.map(r => r.title.toLowerCase().trim())
                    return records.filter((r, idx) => titles.indexOf(r.title.toLowerCase().trim()) !== idx).length
                  })()}
                </p>
              </div>
            </div>

            <div className="border border-border/80 bg-muted/10 p-5 rounded-xl">
              {riskReport ? (
                <div className="space-y-2">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => handleCopy("risk_report", riskReport)}
                      className="px-2 py-1 rounded-lg border border-border bg-card text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === "risk_report" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>Copy Report</span>
                    </button>
                  </div>
                  <div className="text-left select-text">
                    {renderMarkdown(riskReport)}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-muted-foreground/80 font-bold flex flex-col items-center justify-center gap-2">
                  <ShieldAlert className="h-7 w-7 text-muted-foreground/45" />
                  <span>No Compliance Risk scan conducted yet. Click the &quot;Run Risk Scan&quot; button above.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "recommendations" && (
          /* AI Recommendations Cards panel */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <Lightbulb className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                  <span>Proactive AI Recommendations</span>
                </h3>
                <p className="text-[10px] font-semibold text-muted-foreground">Scans system registry gaps and generates interactive action recommendation cards.</p>
              </div>

              <Button
                onClick={generateRecommendations}
                disabled={isGeneratingReco || records.length === 0}
                className="bg-amber-600 text-white hover:bg-amber-700 text-xs font-extrabold px-4 h-9 cursor-pointer gap-1.5 rounded-lg shadow-sm shrink-0"
              >
                {isGeneratingReco ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Mapping Actions...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>{recommendations.length > 0 ? "Regenerate Actions" : "Generate Recommendations"}</span>
                  </>
                )}
              </Button>
            </div>

            {recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {recommendations.map((reco) => {
                  const impactColor = 
                    reco.impact === "High" ? "border-rose-500/20 bg-rose-500/5 text-rose-500" :
                    reco.impact === "Medium" ? "border-amber-500/20 bg-amber-500/5 text-amber-600" :
                    "border-blue-500/20 bg-blue-500/5 text-blue-500"

                  return (
                    <div 
                      key={reco.id} 
                      className="border border-border/80 bg-card rounded-xl p-4 flex flex-col justify-between hover:border-primary/45 transition-all text-left shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-extrabold uppercase border px-2 py-0.5 rounded-md ${impactColor}`}>
                            {reco.impact} Impact
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground leading-snug">{reco.title}</h4>
                        <p className="text-[10px] font-semibold text-muted-foreground/90 leading-relaxed">
                          {reco.description}
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => router.push(reco.url)}
                        variant="outline"
                        className="mt-4 w-full h-8 text-[10px] font-extrabold gap-1 cursor-pointer bg-muted/30 hover:bg-primary/5 hover:border-primary hover:text-primary rounded-lg border-border"
                      >
                        <span>{reco.actionLabel}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-20 text-center border border-border/80 bg-muted/10 rounded-xl text-xs font-semibold text-muted-foreground/80 flex flex-col items-center justify-center gap-2">
                <ShieldCheck className="h-7 w-7 text-emerald-500/70" />
                <span>All systems compliant. Click &quot;Generate Recommendations&quot; to audit.</span>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
