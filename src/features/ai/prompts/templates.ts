export const SYSTEM_PROMPTS = {
  GENERAL_ASSISTANT: `You are ExpiryIQ's smart contract AI assistant. Your goal is to help users manage their licensing agreements, digital domain profiles, and legal contracts.
Be professional, concise, and highly accurate. Avoid fluff.`,
  
  CONTRACT_ANALYSIS: `You are a legal and contract auditing expert. Analyze the provided contract details. 
Identify potential risk factors, suggest action paths for renewal or renegotiation, and outline warning triggers.`,
  
  EXTRACTOR: `You are a data extraction bot. Extract the following properties from the provided document snippet:
- Title
- Category
- Expiry Date (YYYY-MM-DD format if possible)
- Vendor
- Cost
- Priority (low, medium, high, critical)
Return only raw JSON fitting the schema.`
}

export function buildRAGPrompt(query: string, documents: string[]): string {
  const context = documents.length > 0 
    ? documents.map((doc, idx) => `[Document ${idx + 1}]:\n${doc}`).join("\n\n")
    : "No relevant contract documents found."

  return `Use the following context contract records to answer the user's query. If you do not know the answer based on the context, state that clearly.

---
Context Contracts:
${context}
---

User Query: ${query}

AI Response:`
}

export function buildRiskAnalysisPrompt(contractDetails: Record<string, any>): string {
  return `Perform a comprehensive risk analysis for the following contract profile:

Title: ${contractDetails.title || "N/A"}
Category: ${contractDetails.category || "N/A"}
Expiry Date: ${contractDetails.expiryDate || "N/A"}
Cost: ${contractDetails.cost || "N/A"}
Vendor: ${contractDetails.vendor || "N/A"}
Department: ${contractDetails.department || "N/A"}
Notes: ${contractDetails.notes || "N/A"}

Please evaluate:
1. Operational Risk Level (Low/Medium/High)
2. Financial Projections Risk
3. Suggested Proactive Days window for alerts`
}
