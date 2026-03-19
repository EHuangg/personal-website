const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434"
const USE_GROQ = !!process.env.GROQ_API_KEY

// ── Shared fetch ────────────────────────────────────────────────────────────

async function callLLM(
  messages: { role: string; content: string }[],
  options: { model?: string; temperature?: number; max_tokens?: number } = {}
): Promise<string> {
  if (USE_GROQ) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model ?? "llama-3.3-70b-versatile",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 6000,
      }),
    })
    if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ""
  } else {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL ?? "llama3.2",
        messages,
        stream: false,
      }),
    })
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`)
    const data = await res.json()
    return data.message?.content ?? ""
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export type Brief = {
  intent: "restyle" | "addContent" | "removeContent" | "embed" | "reset" | "other"
  preserveContent: boolean
  preserveLayout: boolean
  resetContext: boolean
  generatorInstruction: string
}

// ── Stage 1: Interpreter ─────────────────────────────────────────────────────

export async function interpretPrompt(
  userPrompt: string,
  hasCurrentSite: boolean
): Promise<Brief> {
  const system = `You are a prompt interpreter for a website builder. A user has submitted a prompt to modify a personal website.

Your job is to analyze the prompt and output a JSON brief for the generator. Output ONLY valid JSON, no explanation, no markdown.

JSON shape:
{
  "intent": one of: "restyle" | "addContent" | "removeContent" | "embed" | "reset" | "other",
  "preserveContent": boolean — true if all existing text/sections should be kept,
  "preserveLayout": boolean — true if the page structure/layout should stay the same,
  "resetContext": boolean — true if the user wants to start completely fresh,
  "generatorInstruction": string — a clear, detailed instruction for the HTML generator that captures exactly what to do
}

Rules:
- "restyle" = color/font/theme changes only
- "addContent" = adding new sections, text, elements
- "removeContent" = removing existing content
- "embed" = adding a YouTube/video/image embed
- "reset" = start over from scratch
- preserveContent should be true for restyle, false for reset
- generatorInstruction must be specific and actionable, not just repeat the user prompt
- Always append to generatorInstruction: "Do not modify or remove the sticky header bar at the top of the page (class: protected-bar)."`

  const user = `User prompt: "${userPrompt}"
Has existing site: ${hasCurrentSite}

Output the JSON brief.`

  const raw = await callLLM(
    [{ role: "system", content: system }, { role: "user", content: user }],
    { model: "llama-3.1-8b-instant", temperature: 0.2, max_tokens: 500 }
  )

  try {
    const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned) as Brief
  } catch {
    // Fallback brief if parsing fails
    return {
      intent: "other",
      preserveContent: true,
      preserveLayout: false,
      resetContext: false,
      generatorInstruction: `Apply this change to the website: "${userPrompt}". Do not modify or remove the sticky header bar at the top of the page (class: protected-bar).`,
    }
  }
}

// ── Stage 2: Generator ───────────────────────────────────────────────────────

const GENERATOR_SYSTEM = `You are an expert creative web designer. You produce complete, stunning personal websites as a single HTML block.

Output ONLY raw HTML with an embedded <style> block. No markdown, no code fences, no explanation.
Do NOT include <html>, <head>, or <body> tags.

EVERY output must have:
- A <style> block with Google Fonts (@import), CSS variables at :root, and full page styling
- Beautiful typography: large name heading, readable body, good line-height
- A cohesive color scheme that fits the requested mood
- All sections present: name, bio, experience, projects, contact links
- Subtle polish: hover states, clean dividers, consistent spacing
- Max-width centered layout (~700px), generous padding

HARD RULES:
- No <script> tags
- No <video> or <audio> tags  
- For YouTube: <iframe width="100%" height="400" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
- Do NOT touch elements with class "protected-bar" — this is a system header injected outside your output

Evan Huang's info:
- Mathematics graduate, University of Waterloo
- BlackBerry (Network Engineer Intern): Python monitoring scripts, Grafana dashboards, AWS/Linux infra
- Compugen (Network Ops Intern): Azure monitoring, incident response, 99.9% SLA
- Projects: this website (Next.js), Live Subtitles (JS/Python/C++), Yamagotchi (Python, Fantasy NBA)
- Interests: basketball, soccer, pixel art
- Links: github.com/EHuangg | evan.hu.huang@gmail.com | linkedin.com/in/evan-huang-187116179`

export async function generateHTML(brief: Brief, currentHTML: string | null): Promise<string> {
  const contextSection = (brief.preserveContent || brief.preserveLayout) && currentHTML
    ? `\n\nCurrent website HTML to build upon:\n${currentHTML}\n`
    : ""

  const user = `${contextSection}
Instruction: ${brief.generatorInstruction}

Generate the complete HTML now.`

  return callLLM(
    [{ role: "system", content: GENERATOR_SYSTEM }, { role: "user", content: user }],
    { temperature: 0.8, max_tokens: 6000 }
  )
}

// ── Stage 3: Verifier ─────────────────────────────────────────────────────────

const VERIFIER_SYSTEM = `You are an HTML quality verifier for a personal website builder.

You will receive:
1. The original instruction brief
2. The generated HTML

Your job is to check:
- Does the HTML match the intent of the brief?
- Are there any obvious structural HTML errors (unclosed tags, broken nesting)?
- Is the styling complete and coherent?
- Does it include all required content (name, bio, experience, projects, contacts)?
- Does it avoid forbidden elements (script, video, audio tags)?

Output ONLY valid JSON:
{
  "approved": boolean,
  "issues": string[] — list of specific problems found (empty if approved),
  "fixInstruction": string — specific instruction to fix the issues (empty if approved)
}`

export async function verifyHTML(
  brief: Brief,
  html: string
): Promise<{ approved: boolean; issues: string[]; fixInstruction: string }> {
  const user = `Brief:
${JSON.stringify(brief, null, 2)}

Generated HTML:
${html}

Verify and output JSON.`

  const raw = await callLLM(
    [{ role: "system", content: VERIFIER_SYSTEM }, { role: "user", content: user }],
    { model: "llama-3.1-8b-instant", temperature: 0.1, max_tokens: 500 }
  )

  try {
    const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    return { approved: true, issues: [], fixInstruction: "" }
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function generatePageHTML(
  userPrompt: string,
  currentHTML: string | null
): Promise<string> {
  // Stage 1: Interpret
  const brief = await interpretPrompt(userPrompt, !!currentHTML)
  console.log("[pipeline] Brief:", JSON.stringify(brief))

  const contextHTML = brief.resetContext ? null : currentHTML

  // Stage 2: Generate (with up to 2 retries based on verifier feedback)
  let html = await generateHTML(brief, contextHTML)
  console.log("[pipeline] Generated HTML length:", html.length)

  // Stage 3: Verify + retry loop (max 2 attempts)
  for (let attempt = 0; attempt < 2; attempt++) {
    const verification = await verifyHTML(brief, html)
    console.log(`[pipeline] Verify attempt ${attempt + 1}:`, verification.approved, verification.issues)

    if (verification.approved) break

    if (verification.fixInstruction) {
      const fixedBrief: Brief = {
        ...brief,
        generatorInstruction: `${brief.generatorInstruction}\n\nFix these issues from the previous attempt: ${verification.fixInstruction}`,
      }
      html = await generateHTML(fixedBrief, contextHTML)
    } else {
      break
    }
  }

  return html
}