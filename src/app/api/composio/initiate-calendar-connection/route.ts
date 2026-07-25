import { NextResponse } from "next/server"
import { Composio } from "@composio/core"

export async function POST() {
  const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: "Composio API key not configured" },
      { status: 500 }
    )
  }

  try {
    const composio = new Composio({ apiKey })

    const authConfigs = await composio.authConfigs.list({
      toolkit: "googlecalendar",
    })

    if (!authConfigs.items || authConfigs.items.length === 0) {
      return NextResponse.json(
        { error: "No Google Calendar auth configs found" },
        { status: 404 }
      )
    }

    const authConfig = authConfigs.items[0]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const callbackUrl = `${appUrl}/api/calendar/callback`

    const linkResult = await composio.connectedAccounts.link(
      "voicemail-user",
      authConfig.id,
      { callbackUrl, allowMultiple: true }
    )

    return NextResponse.json({
      redirectUrl: linkResult.redirectUrl,
      connectionId: (linkResult as any).connectionId || (linkResult as any).id,
    })
  } catch (error) {
    console.error("Failed to initiate Google Calendar connection:", error)
    return NextResponse.json(
      { error: "Failed to initiate connection" },
      { status: 500 }
    )
  }
}
