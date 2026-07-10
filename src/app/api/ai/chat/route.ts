import { NextResponse } from "next/server"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function POST(req: Request) {
  try {
    // 1. Never expose API key - read from server-side process env only!
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "Groq API key not configured on server." } },
        { status: 500 }
      )
    }

    const { model, messages, temperature, max_tokens } = await req.json()

    // 2. Fetch Groq API
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "llama-3.3-70b-versatile",
        messages,
        temperature: temperature ?? 0.2,
        max_tokens: max_tokens ?? 1024
      })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: { message: errorData?.error?.message || "Groq API communication failure" } },
        { status: res.status }
      )
    }

    const data = await res.json()
    const answer = data?.choices?.[0]?.message?.content || ""
    const usage = data?.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0
    } : undefined

    return NextResponse.json({ answer, usage })
  } catch (err) {
    console.error("Server-side AI Route Error:", err)
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : "Internal server error" } },
      { status: 500 }
    )
  }
}
