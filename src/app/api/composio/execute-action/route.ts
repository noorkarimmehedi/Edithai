import { Composio } from "@composio/core"

const MOCK_EMAILS = [
  {
    id: "mock-1",
    subject: "Welcome to Voicemail AI",
    from: "team@voicemail-ai.com",
    snippet: "Thank you for trying our AI-powered voicemail assistant...",
    date: new Date().toISOString(),
  },
  {
    id: "mock-2",
    subject: "Your weekly summary",
    from: "summary@voicemail-ai.com",
    snippet: "Here's what happened this week with your voicemails...",
    date: new Date(Date.now() - 86400000).toISOString(),
  },
]

function getMockResponse(actionName: string, params: any) {
  switch (actionName) {
    case "GMAIL_FETCH_EMAILS":
      return { emails: MOCK_EMAILS, count: MOCK_EMAILS.length }
    case "GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID":
      return {
        id: params?.message_id || "mock-1",
        subject: "Mock Email",
        from: "mock@example.com",
        body: "This is mock email content.",
      }
    default:
      return { success: true, mock: true }
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { actionName, params, connectedAccountId } = body

    if (!connectedAccountId) {
      return Response.json({ error: "Missing connectedAccountId" }, { status: 400 })
    }

    if (connectedAccountId.startsWith("mock-")) {
      return Response.json(getMockResponse(actionName, params))
    }

    const composio = new Composio({ apiKey })

    const response = await composio.tools.execute(actionName, {
      connectedAccountId,
      arguments: params || {},
      userId: "voicemail-user",
      dangerouslySkipVersionCheck: true,
    })

    if (actionName.startsWith("GOOGLECALENDAR")) {
      console.log("[execute-action] Calendar raw response keys:", Object.keys(response || {}))
      if (Array.isArray(response)) console.log("  Response is an array")
      if (response && typeof response === "object") {
        for (const key of Object.keys(response)) {
          const val = (response as any)[key]
          console.log(`  key: ${key} => type: ${Array.isArray(val) ? "array" : typeof val}`)
          if (Array.isArray(val)) console.log(`    length: ${val.length}`)
        }
      }
    }

    return Response.json(response)
  } catch (error: any) {
    console.error("Composio execute error:", error)
    return Response.json({ error: error.message || String(error) }, { status: 500 })
  }
}
