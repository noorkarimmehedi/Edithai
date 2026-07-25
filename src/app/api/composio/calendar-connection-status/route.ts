import { NextRequest, NextResponse } from "next/server"
import { Composio } from "@composio/core"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const connectionId = searchParams.get("connectionId")
  const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY

  if (!apiKey) {
    return NextResponse.json({ status: "disconnected", error: "API key not configured" })
  }

  try {
    const composio = new Composio({ apiKey })

    // If we have a specific connection ID, check it
    if (connectionId) {
      const connection = await composio.connectedAccounts.get(connectionId)
      if (connection && connection.status === "ACTIVE") {
        return NextResponse.json({ status: "connected", connectionId })
      }
      return NextResponse.json({ status: "disconnected" })
    }

    // Otherwise, check for any active Google Calendar connections
    const connections = await composio.connectedAccounts.list({
      userIds: ["voicemail-user"],
      toolkitSlugs: ["googlecalendar"],
    })

    const activeConnection = connections.items?.find(
      (conn: { status: string }) => conn.status === "ACTIVE"
    )

    if (activeConnection) {
      return NextResponse.json({
        status: "connected",
        connectionId: activeConnection.id,
      })
    }

    return NextResponse.json({ status: "disconnected" })
  } catch (error) {
    console.error("Failed to check calendar connection status:", error)
    return NextResponse.json({ status: "disconnected" })
  }
}
