import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
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
}