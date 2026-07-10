export interface PromptRecordData {
  title: string
  category: string
  expiryDate: string
  vendor?: string
  department?: string
  priority: string
  cost?: number
  notes?: string
}

export class PromptLibrary {
  /**
   * Helper to truncate input notes/details to maintain prompt context under 2000 characters
   */
  private static sanitizeText(text?: string, maxChars: number = 400): string {
    if (!text) return "N/A"
    const cleaned = text.trim().replace(/\s+/g, " ")
    if (cleaned.length <= maxChars) return cleaned
    return cleaned.slice(0, maxChars) + "..."
  }

  /**
   * Summarizes record parameters into a clean string representation
   */
  private static stringifyRecord(data: PromptRecordData): string {
    const costStr = data.cost !== undefined ? `$${data.cost}` : "N/A"
    return `Title: ${data.title}
Category: ${data.category}
Expiry: ${data.expiryDate}
Vendor: ${data.vendor || "N/A"}
Dept: ${data.department || "N/A"}
Priority: ${data.priority}
Cost: ${costStr}
Notes: ${this.sanitizeText(data.notes, 300)}`
  }

  // 1. Executive Summary
  static getExecutiveSummaryPrompt(data: PromptRecordData): string {
    const context = this.stringifyRecord(data)
    return `Generate a concise 2-sentence executive summary of the following contract record:
---
${context}
---
Focus on the primary purpose and commercial impact. Keep under 300 characters.`
  }

  // 2. Compliance Report
  static getComplianceReportPrompt(data: PromptRecordData): string {
    const context = this.stringifyRecord(data)
    return `Draft a brief compliance audit report for this contract:
---
${context}
---
Identify if there are immediate warnings, security certifications required, or department responsibilities. Keep it bulleted and under 400 characters.`
  }

  // 3. Risk Analysis
  static getRiskAnalysisPrompt(data: PromptRecordData): string {
    const context = this.stringifyRecord(data)
    return `Perform a quick operational risk review for this profile:
---
${context}
---
Specify:
1. Operational Risk Level (Low/Medium/High)
2. Immediate Threat (None or list risk)
3. Action Plan (1 sentence)`
  }

  // 4. Renewal Recommendation
  static getRenewalRecommendationPrompt(data: PromptRecordData, remainingDays: number): string {
    const context = this.stringifyRecord(data)
    return `Provide a renewal recommendation for this contract which expires in ${remainingDays} days:
---
${context}
---
State whether we should renew, renegotiate terms, or terminate. Give a 1-sentence business rationale.`
  }

  // 5. Record Explanation
  static getRecordExplanationPrompt(data: PromptRecordData, userQuestion: string): string {
    const context = this.stringifyRecord(data)
    const truncatedQuestion = this.sanitizeText(userQuestion, 150)
    return `Based ONLY on the contract details below, answer the question: "${truncatedQuestion}"
---
${context}
---
Be extremely brief. Do not assume or add details outside this context.`
  }

  // 6. Reminder Message
  static getReminderMessagePrompt(data: PromptRecordData, remainingDays: number): string {
    const context = this.stringifyRecord(data)
    return `Generate a professional Slack/email notification reminder for a contract expiring in ${remainingDays} days:
---
${context}
---
Format: "[Contract Name] expires in [X] days. Action required: [Renegotiate/Renew]. Contact: [Department]." Keep under 200 characters.`
  }

  // 7. Natural Language Search
  static getNaturalLanguageSearchPrompt(query: string, availableCategories: string[]): string {
    const truncatedQuery = this.sanitizeText(query, 150)
    return `Translate this search query into structured filter fields:
Query: "${truncatedQuery}"
Available Categories: ${availableCategories.join(", ")}

Return ONLY a JSON block like:
{
  "category": "categoryName or null",
  "priority": "low/medium/high/critical or null",
  "vendor": "vendorName or null",
  "isExpired": true/false/null
}`
  }
}
