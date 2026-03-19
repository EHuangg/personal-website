import { prisma } from "../lib/prisma"
import { generatePageHTML } from "./llm"
import { validateAndClean } from "./validator"
import { getBaselineHTML } from "./baseline"

export async function runDailyBuild(): Promise<{
  success: boolean
  message: string
}> {
  // Get the next queued submission (FIFO)
  const submission = await prisma.submission.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
  })

  if (!submission) {
    // Queue is empty — set default snapshot as current
    await ensureDefaultSnapshot()
    return { success: true, message: "Queue empty — default site is live." }
  }

  try {
    // Check what's currently live
    const currentSnapshot = await prisma.siteSnapshot.findFirst({
      where: { isCurrent: true },
      select: { isDefault: true, buildId: true },
    })

    // If current snapshot is default, use baseline — not the last build
    const isCurrentDefault = !currentSnapshot || currentSnapshot.isDefault

    const currentHTML = await (async () => {
      if (isCurrentDefault) return getBaselineHTML()
      // Get the raw HTML from the build linked to the current snapshot
      if (currentSnapshot?.buildId) {
        const build = await prisma.build.findUnique({
          where: { id: currentSnapshot.buildId },
          select: { generatedPatch: true },
        })
        const patch = build?.generatedPatch as { rawHTML?: string } | null
        return patch?.rawHTML ?? getBaselineHTML()
      }
      return getBaselineHTML()
    })()

    const RESET_KEYWORDS = ["remove everything", "start fresh", "start over", "reset", "blank", "clean slate", "from scratch", "wipe", "clear everything", "remove all"]
    const isReset = RESET_KEYWORDS.some((kw) => submission.prompt.toLowerCase().includes(kw))

    // Generate HTML from prompt, passing current HTML as context unless it's a reset
    const rawHTML = await generatePageHTML(submission.prompt, isReset ? null : currentHTML)
    const cleanHTML = validateAndClean(rawHTML)

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