"use client"

import * as React from "react"
import { ExpiryRecord } from "../types"
import { calculateExpiry } from "../utils/expiry-engine"
import { useRouter } from "next/navigation"
import { 
  Sparkles, 
  ShieldAlert, 
  Lightbulb, 
  FolderPlus, 
  CheckCircle2, 
  ArrowUpRight,
  UserCheck,
  BellRing,
  Bookmark
} from "lucide-react"

interface AIInsightsSectionProps {
  records: ExpiryRecord[]
}

export function AIInsightsSection({ records }: AIInsightsSectionProps) {
  const router = useRouter()

  const metrics = React.useMemo(() => {
    if (records.length === 0) {
      return {
        complianceScore: 100,
        riskLevel: "Low",
        criticalExpiries: [],
        upcomingRenewals: [],
        missingOwnersCount: 0,
        missingDocsCount: 0,
        missingRemindersCount: 0,
        categoryCounts: {} as Record<string, number>
      }
    }

    const total = records.length
    let expiredCount = 0
    let warningCount = 0
    let missingOwnersCount = 0
    let missingDocsCount = 0
    let missingRemindersCount = 0
    
    const criticalExpiries: ExpiryRecord[] = []
    const upcomingRenewals: ExpiryRecord[] = []
    const categoryCounts: Record<string, number> = {}

    records.forEach(r => {
      const { remainingDays } = calculateExpiry(r.expiryDate, r.createdAt)
      
      if (remainingDays < 0) {
        expiredCount++
        criticalExpiries.push(r)
      } else if (remainingDays <= 30) {
        warningCount++
        upcomingRenewals.push(r)
      }

      if (!r.owner) missingOwnersCount++
      if (!r.attachments || r.attachments.length === 0) missingDocsCount++
      if (!r.reminderDays || r.reminderDays.length === 0) missingRemindersCount++

      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1
    })

    // Compliance Score: penalize heavily for expired records, lightly for missing owners/files
    const penalty = (expiredCount * 12) + (warningCount * 4) + (missingOwnersCount * 2) + (missingDocsCount * 1.5)
    const score = Math.max(0, Math.min(100, Math.round(100 - penalty)))

    const riskLevel = 
      score < 50 ? "Critical" :
      score < 75 ? "High" :
      score < 90 ? "Medium" : "Low"

    return {
      complianceScore: score,
      riskLevel,
      criticalExpiries,
      upcomingRenewals,
      missingOwnersCount,
      missingDocsCount,
      missingRemindersCount,
      categoryCounts
    }
  }, [records])

  if (records.length === 0) return null

  // Risk Trend simulation from categories count
  const sortedCategories = Object.entries(metrics.categoryCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="border border-border bg-card rounded-xl overflow-hidden select-none text-left mb-6 shadow-xs">
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-primary" />
          <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">AI Portfolio Insights Section</h3>
        </div>
        <span className="text-[9px] font-extrabold uppercase bg-primary/15 border border-primary/20 text-primary px-2 py-0.5 rounded-md">
          Live Firestore Stream
        </span>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        
        {/* Left Column: Gauges & Trends */}
        <div className="p-5 space-y-5">
          {/* Widget 1: Compliance Score */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Compliance Score</h4>
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-muted" strokeWidth="4.5" fill="transparent" />
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    className={`${metrics.complianceScore < 70 ? "stroke-rose-500" : "stroke-primary"}`}
                    strokeWidth="4.5" 
                    fill="transparent" 
                    strokeDasharray={175} 
                    strokeDashoffset={175 - (175 * metrics.complianceScore) / 100} 
                  />
                </svg>
                <span className="absolute text-xs font-black text-foreground">{metrics.complianceScore}%</span>
              </div>
              <div className="space-y-0.5">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.2 text-[10px] font-extrabold uppercase tracking-wide ${
                  metrics.riskLevel === "Critical" || metrics.riskLevel === "High" ? "border-rose-500/20 bg-rose-500/5 text-rose-500" :
                  metrics.riskLevel === "Medium" ? "border-amber-500/20 bg-amber-500/5 text-amber-600" :
                  "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                }`}>
                  {metrics.riskLevel} Risk Profile
                </span>
                <p className="text-[10px] font-semibold text-muted-foreground">Portfolio contains {metrics.criticalExpiries.length} expired contracts.</p>
              </div>
            </div>
          </div>

          {/* Widget 2: Risk Trend */}
          <div className="space-y-2 border-t border-border/40 pt-4">
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Risk Trend Categories</h4>
            <div className="space-y-1.5">
              {sortedCategories.slice(0, 3).map(([cat, val]) => {
                const percent = Math.min(100, Math.round((val / records.length) * 100))
                return (
                  <div key={cat} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
                      <span className="capitalize">{cat}</span>
                      <span>{val} items</span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Middle Column: Summaries & Actions */}
        <div className="p-5 space-y-5">
          {/* Widget 3: AI Summary */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">AI Summary</h4>
            <p className="text-xs font-semibold text-muted-foreground leading-normal">
              Auditing {records.length} records. Expiries are concentrated in the top categories. Gaps identified from missing attachments ({metrics.missingDocsCount} records) and missing owners ({metrics.missingOwnersCount} records). Immediate intervention is recommended.
            </p>
          </div>

          {/* Widget 4: Suggested Actions */}
          <div className="space-y-2 border-t border-border/40 pt-4">
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Suggested Actions</h4>
            <ul className="space-y-1.5">
              <li className="text-[11px] font-semibold text-muted-foreground flex items-start gap-1.5 leading-snug">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Perform renewals on expired Salesforce and priority licenses.</span>
              </li>
              <li className="text-[11px] font-semibold text-muted-foreground flex items-start gap-1.5 leading-snug">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Populate registered owner values to assign assets.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Priorities, Fixes & Renewals */}
        <div className="p-5 space-y-4">
          
          {/* Widget 5 & 7: Priorities & Critical Renewals */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Today's Priorities</h4>
            {metrics.criticalExpiries.length > 0 ? (
              <div className="space-y-1">
                {metrics.criticalExpiries.slice(0, 2).map(r => (
                  <div key={r.id} className="flex items-center justify-between text-xs font-bold text-foreground bg-rose-500/5 border border-rose-500/15 p-2 rounded-lg">
                    <span className="truncate max-w-[140px]">{r.title}</span>
                    <span className="text-[9px] text-rose-500 uppercase tracking-wider font-extrabold">Expired</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>All core systems compliant.</span>
              </p>
            )}
          </div>

          {/* Widget 6: Quick Fixes */}
          <div className="space-y-2 border-t border-border/40 pt-4">
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Compliance Quick Fixes</h4>
            <div className="flex flex-col gap-2">
              
              {metrics.missingOwnersCount > 0 && (
                <button
                  onClick={() => router.push("/dashboard/records?status=active")}
                  className="flex items-center justify-between w-full p-2 rounded-lg border border-border bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-colors text-[10px] font-extrabold text-foreground cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Assign Owners ({metrics.missingOwnersCount})</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                </button>
              )}

              {metrics.missingDocsCount > 0 && (
                <button
                  onClick={() => router.push("/dashboard/records")}
                  className="flex items-center justify-between w-full p-2 rounded-lg border border-border bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-colors text-[10px] font-extrabold text-foreground cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FolderPlus className="h-3.5 w-3.5 text-primary" />
                    <span>Attach Documents ({metrics.missingDocsCount})</span>
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                </button>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
