"use client"

import * as React from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { getDocument, setDocument } from "@/lib/firestore"
import { GroqService } from "@/features/ai/services/groq-service"
import { ExpiryRecord } from "../types"
import { calculateExpiry } from "../utils/expiry-engine"
import { 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp
} from "lucide-react"
import toast from "react-hot-toast"

interface DailyBriefData {
  greeting: string
  criticalRenewals: string[]
  expiringThisWeek: string[]
  departmentsNeedingAttention: string[]
  suggestedActions: string[]
  complianceScore: number
  riskLevel: "Low" | "Medium" | "High" | "Critical"
}

interface DailyBriefProps {
  records: ExpiryRecord[]
}

export function DailyBrief({ records }: DailyBriefProps) {
  const { user } = useAuth()
  const [brief, setBrief] = React.useState<DailyBriefData | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Fetch or generate Daily Compliance Brief on load
  React.useEffect(() => {
    if (!user?.uid || records.length === 0) return

    const loadDailyBrief = async () => {
      const todayStr = new Date().toLocaleDateString().replace(/\//g, "-")
      const briefDocId = `brief_${user.uid}_${todayStr}`

      try {
        setIsLoading(true)
        // 1. Check if today's briefing is already stored in Firestore cache
        const cachedDoc = await getDocument("compliance_briefs", briefDocId)
        if (cachedDoc) {
          setBrief(cachedDoc as DailyBriefData)
          return
        }

        // 2. If not cached, compile statistics for Groq prompter
        const criticalList: string[] = []
        const expiringWeekList: string[] = []
        const deptExpiries: Record<string, number> = {}

        records.forEach(r => {
          const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
          if (remainingDays < 0) {
            criticalList.push(r.title)
            const dept = r.department || "Unassigned"
            deptExpiries[dept] = (deptExpiries[dept] || 0) + 1
          } else if (remainingDays <= 7) {
            expiringWeekList.push(r.title)
          }
        })

        const topRiskDepts = Object.entries(deptExpiries)
          .sort((a, b) => b[1] - a[1])
          .map(([name]) => name)

        // Build prompt matching requirements
        const prompt = `Based on these database stats, compile a Daily Compliance Briefing.
Return ONLY a valid JSON object matching this schema:
{
  "greeting": "Good Morning Zahid. Here is your portfolio summary...",
  "criticalRenewals": ["List of titles already expired"],
  "expiringThisWeek": ["List of titles expiring soon"],
  "departmentsNeedingAttention": ["List of departments with expiries"],
  "suggestedActions": ["List of 2 actionable bullet tasks"],
  "complianceScore": 85,
  "riskLevel": "Low" | "Medium" | "High" | "Critical"
}

Stats to summarize:
- Total records: ${records.length}
- Expired profiles: ${criticalList.join(", ") || "None"}
- Proximity warning (<7 days): ${expiringWeekList.join(", ") || "None"}
- High threat departments: ${topRiskDepts.slice(0, 2).join(", ") || "None"}
- User Name: ${user.displayName || "Administrator"}

Provide direct JSON only.`

        const systemPrompt = "You are a corporate portfolio risk compiler. Answer only in raw JSON."
        const responseText = await GroqService.completeChat(prompt, systemPrompt, {
          temperature: 0.1
        })

        const cleanJSON = responseText.replace(/```json/gi, "").replace(/```/g, "").trim()
        const parsed = JSON.parse(cleanJSON) as DailyBriefData

        // Store today's briefing in Firestore cache to avoid repeating Groq calls!
        await setDocument("compliance_briefs", parsed, briefDocId)
        setBrief(parsed)
      } catch (err) {
        console.error("Failed to load daily compliance brief:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDailyBrief()
  }, [user?.uid, records])

  if (isLoading) {
    return (
      <div className="p-5 border border-border bg-card rounded-xl select-none animate-pulse flex flex-col gap-3">
        <div className="h-4.5 w-48 bg-muted rounded" />
        <div className="h-3.5 w-full bg-muted/60 rounded" />
        <div className="h-3.5 w-2/3 bg-muted/60 rounded" />
      </div>
    )
  }

  if (!brief) return null

  const riskColors = 
    brief.riskLevel === "Critical" || brief.riskLevel === "High" ? "border-rose-500/20 bg-rose-500/5 text-rose-500" :
    brief.riskLevel === "Medium" ? "border-amber-500/20 bg-amber-500/5 text-amber-600" :
    "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"

  return (
    <div className="p-5 border border-border bg-card rounded-xl text-left select-none shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between">
      
      {/* Left panel: Greeting & Briefings */}
      <div className="space-y-4 flex-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
          <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">AI Daily Compliance Brief</h3>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-foreground leading-snug">{brief.greeting}</h4>
          <p className="text-xs font-semibold text-muted-foreground/90">
            Current portfolio audit registers a compliance score of <strong>{brief.complianceScore}%</strong>.
          </p>
        </div>

        {/* Dynamic Lists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 pt-2 border-t border-border/40">
          
          {/* Critical expiries */}
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-rose-500" />
              <span>Critical Renewals</span>
            </p>
            {brief.criticalRenewals.length > 0 ? (
              <ul className="space-y-1">
                {brief.criticalRenewals.map((title, i) => (
                  <li key={i} className="text-xs font-bold text-foreground list-inside list-disc">{title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-semibold text-muted-foreground">All clear</p>
            )}
          </div>

          {/* Expiring week */}
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-amber-500" />
              <span>Expiring This Week</span>
            </p>
            {brief.expiringThisWeek.length > 0 ? (
              <ul className="space-y-1">
                {brief.expiringThisWeek.map((title, i) => (
                  <li key={i} className="text-xs font-bold text-foreground list-inside list-disc">{title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-semibold text-muted-foreground">None</p>
            )}
          </div>

          {/* Attention Departments */}
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Attention Teams</p>
            <p className="text-xs font-bold text-foreground">{brief.departmentsNeedingAttention.join(", ") || "All Compliant"}</p>
          </div>

          {/* Suggested actions */}
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Suggested Actions</p>
            <ul className="space-y-0.5">
              {brief.suggestedActions.map((act, i) => (
                <li key={i} className="text-xs font-semibold text-muted-foreground leading-normal flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Right panel: Risk & Score Gauges */}
      <div className="w-full md:w-44 shrink-0 flex md:flex-col items-center justify-center gap-4 bg-muted/10 border border-border p-4 rounded-xl">
        <div className="text-center space-y-1">
          <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Risk Level</p>
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider ${riskColors}`}>
            {brief.riskLevel}
          </span>
        </div>

        <div className="text-center space-y-1">
          <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">Compliance</p>
          <div className="relative flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" className="stroke-muted" strokeWidth="4" fill="transparent" />
              <circle 
                cx="32" 
                cy="32" 
                r="28" 
                className="stroke-primary" 
                strokeWidth="4" 
                fill="transparent" 
                strokeDasharray={175} 
                strokeDashoffset={175 - (175 * brief.complianceScore) / 100} 
              />
            </svg>
            <span className="absolute text-xs font-black text-foreground">{brief.complianceScore}%</span>
          </div>
        </div>
      </div>

    </div>
  )
}
