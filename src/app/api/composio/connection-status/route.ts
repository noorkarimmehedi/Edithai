import { Composio } from "@composio/core"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const connectionId = searchParams.get("connectionId")

  const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY
  if (!apiKey) {
    return Response.json({ status: "disconnected", error: "API key not configured" })
  }

  try {
    const composio = new Composio({ apiKey })

    if (connectionId) {
      const account = await composio.connectedAccounts.list({
        userIds: ["voicemail-user"],
        statuses: ["ACTIVE"],
      })
      const connectedAccount = account.items.find((a) => a.id === connectionId)
      const connected = connectedAccount?.status === "ACTIVE"
      return Response.json({ status: connected ? "connected" : "disconnected" })
    }

    const accounts = await composio.connectedAccounts.list({
      userIds: ["voicemail-user"],
      toolkitSlugs: ["gmail"],
      statuses: ["ACTIVE"],
    })
    if (accounts.items.length > 0) {
      return Response.json({ status: "connected", connectionId: accounts.items[0].id })
    }
    return Response.json({ status: "disconnected" })
  } catch (error) {
    console.error("Composio status error:", error)
    return Response.json({ status: "disconnected", error: String(error) })
  }
}
