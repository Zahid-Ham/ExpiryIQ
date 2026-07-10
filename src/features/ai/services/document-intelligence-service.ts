import { getDocument, setDocument } from "@/lib/firestore"
import { GroqService } from "./groq-service"

export interface ExtractedMetadata {
  title: string
  expiryDate: string
  issueDate: string
  vendor: string
  department: string
  documentType: string
}

export class DocumentIntelligenceService {
  /**
   * Generates a unique SHA-256 hash from file array buffer
   */
  static async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  }

  /**
   * Extracts text from PDF using pdfjs-dist
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      // Dynamic import to prevent SSR rendering crashes
      const pdfjs = await import("pdfjs-dist")
      
      // Set worker path
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
      
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      let text = ""
      const pagesToScan = Math.min(pdf.numPages, 3) // Scan first 3 pages to optimize tokens

      for (let i = 1; i <= pagesToScan; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((item: any) => item.str).join(" ")
        text += pageText + "\n"
      }
      return text.trim()
    } catch (err) {
      console.error("PDF text extraction failed:", err)
      return ""
    }
  }

  /**
   * Converts file to Base64 string
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Strip data:image/*;base64, prefix
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  /**
   * Main service handler: Extracts metadata with hashing cache checks
   */
  static async extractMetadata(file: File): Promise<ExtractedMetadata> {
    // 1. Calculate File Hash
    const hash = await this.calculateFileHash(file)

    // 2. Cache extraction results check (never reprocess twice)
    const cached = await getDocument("document_intelligence_cache", hash)
    if (cached) {
      return cached as unknown as ExtractedMetadata
    }

    let extractedData: ExtractedMetadata = {
      title: "",
      expiryDate: "",
      issueDate: "",
      vendor: "",
      department: "",
      documentType: ""
    }

    const isPDF = file.type === "application/pdf"

    if (isPDF) {
      // Try text extraction to optimize Groq token usage (Do not use OCR unless necessary)
      const text = await this.extractTextFromPDF(file)
      
      if (text) {
        // Text-based PDF extraction via Llama-3-70b-versatile
        const prompt = `Analyze this extracted document text and pull these metadata fields:
- Document Title (title)
- Expiry Date (expiryDate, format: YYYY-MM-DD or empty)
- Issue Date (issueDate, format: YYYY-MM-DD or empty)
- Vendor Name (vendor)
- Department (department)
- Document Type (documentType, e.g. Contract, License, Certificate)

Return ONLY a valid JSON object matching this schema:
{
  "title": "",
  "expiryDate": "",
  "issueDate": "",
  "vendor": "",
  "department": "",
  "documentType": ""
}

Document Text content:
---
${text.slice(0, 3500)}
---`

        const response = await GroqService.completeChat(prompt, "You are a document analyzer. Output ONLY raw JSON.", {
          temperature: 0.1
        })

        try {
          const clean = response.replace(/```json/gi, "").replace(/```/g, "").trim()
          extractedData = JSON.parse(clean)
        } catch (e) {
          console.error("Failed to parse JSON response:", response, e)
        }
      } else {
        // PDF has no text (Scanned PDF) -> Fallback to vision model proxy
        extractedData = await this.extractViaVisionModel(file)
      }
    } else {
      // Image file (PNG, JPEG) -> vision completion directly
      extractedData = await this.extractViaVisionModel(file)
    }

    // 3. Store extracted metadata in Firestore cache
    await setDocument("document_intelligence_cache", extractedData, hash)

    return extractedData
  }

  /**
   * Fallback to Groq Vision Model (llama-3.2-11b-vision-preview)
   */
  private static async extractViaVisionModel(file: File): Promise<ExtractedMetadata> {
    try {
      const base64 = await this.fileToBase64(file)
      
      // Post direct body to local proxy
      const messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract these fields from this document image:
- Document Title (title)
- Expiry Date (expiryDate, format: YYYY-MM-DD or empty)
- Issue Date (issueDate, format: YYYY-MM-DD or empty)
- Vendor Name (vendor)
- Department (department)
- Document Type (documentType)

Return ONLY a valid JSON object matching this schema:
{
  "title": "",
  "expiryDate": "",
  "issueDate": "",
  "vendor": "",
  "department": "",
  "documentType": ""
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64}`
              }
            }
          ]
        }
      ]

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
          messages,
          temperature: 0.1,
          max_tokens: 512
        })
      })

      if (!res.ok) {
        throw new Error(`Vision API responded with code ${res.status}`)
      }

      const data = await res.json()
      const answer = data.answer || ""
      const clean = answer.replace(/```json/gi, "").replace(/```/g, "").trim()
      
      return JSON.parse(clean) as ExtractedMetadata
    } catch (err) {
      console.error("Groq vision metadata extraction failed:", err)
      return {
        title: "",
        expiryDate: "",
        issueDate: "",
        vendor: "",
        department: "",
        documentType: ""
      }
    }
  }
}
