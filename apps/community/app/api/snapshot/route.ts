import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Always return the most recent non-default snapshot if one exists
    // The daily check handles whether to show default or not
    const snapshot = await prisma.siteSnapshot.findFirst({
      where: { isCurrent: true },
      select: {
        id: true,
        htmlContent: true,
        authorDisplayName: true,
        isDefault: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ snapshot })
  } catch (err) {
    console.error("Snapshot error:", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}