import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerFingerprint } from "@/lib/fingerprint"
import { checkCooldown } from "@/lib/cooldown"
import { Filter } from "bad-words"

const filter = new Filter()

export async function POST(req: Request) {
  try {
    const { prompt, displayName } = await req.json()

    // Basic validation
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 })
    }

    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt.length < 5) {
      return NextResponse.json({ error: "Prompt is too short." }, { status: 400 })
    }
    if (trimmedPrompt.length > 500) {
      return NextResponse.json({ error: "Prompt must be under 500 characters." }, { status: 400 })
    }

    // Profanity check
    if (filter.isProfane(trimmedPrompt)) {
      return NextResponse.json(
        { error: "Your prompt was rejected due to inappropriate content." },
        { status: 400 }
      )
    }

    // Name validation
    let cleanName: string | null = null
    if (displayName && typeof displayName === "string") {
      const trimmedName = displayName.trim().slice(0, 30)
      if (filter.isProfane(trimmedName)) {
        return NextResponse.json(
          { error: "Display name contains inappropriate content." },
          { status: 400 }
        )
      }
      cleanName = trimmedName || null
    }

    // Fingerprint + cooldown
    const fingerprintHash = getServerFingerprint(req)
    const cooldown = await checkCooldown(fingerprintHash)
    if (!cooldown.allowed) {
      return NextResponse.json({ error: cooldown.reason }, { status: 429 })
    }

    // Get queue position (count of queued submissions ahead)
    const queueLength = await prisma.submission.count({
      where: { status: "QUEUED" },
    })

    // Estimated live date: one change per day
    const today = new Date()
    const liveDate = new Date(today)
    liveDate.setDate(liveDate.getDate() + queueLength + 1)

    // Create submission + fingerprint record atomically
    const submission = await prisma.submission.create({
      data: {
        prompt: trimmedPrompt,
        displayName: cleanName,
        fingerprintHash,
        status: "QUEUED",
        fingerprints: {
          create: { fingerprintHash },
        },
      },
    })

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      estimatedLiveDate: liveDate.toISOString(),
      queuePosition: queueLength + 1,
    })
  } catch (err) {
    console.error("Submit error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}