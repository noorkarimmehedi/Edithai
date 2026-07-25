import { Composio } from "@composio/core"

export async function POST() {
  const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    const composio = new Composio({ apiKey })
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const callbackUrl = `${origin}/api/gmail/callback`

    const authConfigs = await composio.authConfigs.list({ toolkit: "gmail" })
    const authConfig = authConfigs.items?.[0]
    if (!authConfig) {
      return Response.json({ error: "No auth config found for Gmail. Please create one in the Composio dashboard." }, { status: 400 })
    }

    const connectionRequest = await composio.connectedAccounts.link(
      "voicemail-user",
      authConfig.id,
      { callbackUrl, allowMultiple: true }
    )

    return Response.json({
      redirectUrl: connectionRequest.redirectUrl,
      connectionId: connectionRequest.id,
    })
  } catch (error) {
    console.error("Composio link error:", error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
