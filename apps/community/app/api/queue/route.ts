import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const queue = await prisma.submission.findMany({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        prompt: true,
        displayName: true,
        createdAt: true,
      },
    })

    // Attach estimated live date to each entry
    const today = new Date()
    const entries = queue.map((entry: typeof queue[0], i: number) => {
      const liveDate = new Date(today)
      liveDate.setDate(liveDate.getDate() + i + 1)
      return { ...entry, estimatedLiveDate: liveDate.toISOString() }
    })

    return NextResponse.json({ queue: entries })
  } catch (err) {
    console.error("Queue error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}