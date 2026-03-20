import { NextResponse } from "next/server"
import { runDailyBuild } from "@/pipeline/daily-build"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  console.log("Received auth header:", JSON.stringify(authHeader))
  console.log("Expected:", JSON.stringify(`Bearer ${CRON_SECRET}`))

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({
      error: "Unauthorized",
      received: authHeader,
      expected: `Bearer ${CRON_SECRET?.slice(0, 3)}...`
    }, { status: 401 })
  }

  const result = await runDailyBuild()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}