import { prisma } from "../lib/prisma"
import { generatePageHTML } from "./llm"
import { validateAndClean } from "./validator"
import { swapImages } from "./images"

export async function runDailyBuild(): Promise<{
  success: boolean
  message: string
}> {
  const submission = await prisma.submission.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
  })

  if (!submission) {
    await ensureDefaultSnapshot()
    return { success: true, message: "Queue empty — default site is live." }
  }

  try {
    // Always load the last successful raw HTML as context — no default/community check needed
    const lastBuild = await prisma.build.findFirst({
      where: { status: "SUCCESS" },
      orderBy: { builtAt: "desc" },
      select: { generatedPatch: true },
    })

    const lastRawHTML = (() => {
      if (!lastBuild) return null
      const patch = lastBuild.generatedPatch as { rawHTML?: string } | null
      return patch?.rawHTML ?? null
    })()

    // Check if this is a visual build submission
    const isVisual = submission.prompt.startsWith("[visual]\n")

    let rawHTML: string
    let cleanHTML: string

    if (isVisual) {
      // Visual build — HTML is already generated, just validate and swap images
      rawHTML = submission.prompt.replace("[visual]\n", "")
      const validatedHTML = validateAndClean(rawHTML)
      cleanHTML = await swapImages(validatedHTML)
      console.log("[pipeline] Visual build processed")
    } else {
      // AI build — run through LLM pipeline
      rawHTML = await generatePageHTML(submission.prompt, lastRawHTML)
      const validatedHTML = validateAndClean(rawHTML)
      cleanHTML = await swapImages(validatedHTML)
      console.log("[pipeline] AI build processed")
    }

    // Create build record
    const build = await prisma.build.create({
      data: {
        submissionId: submission.id,
        generatedPatch: { rawHTML, cleanHTML },
        status: "SUCCESS",
      },
    })

    // Mark all existing snapshots as not current
    await prisma.siteSnapshot.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false },
    })

    // Create new current snapshot
    await prisma.siteSnapshot.create({
      data: {
        buildId: build.id,
        htmlContent: cleanHTML,
        authorDisplayName: submission.displayName,
        authorFingerprint: submission.fingerprintHash,
        isCurrent: true,
        isDefault: false,
      },
    })

    // Mark submission as built
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "BUILT" },
    })

    return {
      success: true,
      message: `Built snapshot from submission ${submission.id} — "${submission.prompt.slice(0, 60)}"`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"

    // Create failed build record
    await prisma.build.create({
      data: {
        submissionId: submission.id,
        generatedPatch: {},
        status: "FAILED",
        errorMessage: message,
      },
    })

    // Mark submission as skipped so it doesn't block the queue
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "SKIPPED" },
    })

    return { success: false, message: `Build failed: ${message}` }
  }
}

async function ensureDefaultSnapshot() {
  const existing = await prisma.siteSnapshot.findFirst({
    where: { isDefault: true, isCurrent: true },
  })

  if (!existing) {
    await prisma.siteSnapshot.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false },
    })

    await prisma.siteSnapshot.create({
      data: {
        htmlContent: "",
        authorDisplayName: null,
        authorFingerprint: "default",
        isCurrent: true,
        isDefault: true,
      },
    })
  }
}