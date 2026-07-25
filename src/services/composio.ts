import type { Email, GmailConfig } from "@/types"

let config: GmailConfig | null = null

function getEnvConfig(): GmailConfig | null {
  const apiKey = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_COMPOSIO_API_KEY : undefined
  if (!apiKey) return null
  return { apiKey }
}

class GmailIntegration {
  configure(c: GmailConfig) {
    config = c
  }

  private ensureConfigured() {
    if (!config) {
      const envConfig = getEnvConfig()
      if (envConfig) config = envConfig
    }
  }

  isConfigured() {
    this.ensureConfigured()
    return config !== null && !!config.apiKey
  }

  async getConnectionStatus(): Promise<"connected" | "disconnected"> {
    this.ensureConfigured()
    if (!config?.apiKey) return "disconnected"
    if (config.connectionId) {
      try {
        const res = await fetch(
          `/api/composio/connection-status?connectionId=${config.connectionId}`
        )
        const data = await res.json()
        if (data.status === "connected") {
          if (data.connectionId) config.connectionId = data.connectionId
          return "connected"
        }
      } catch {
        return "disconnected"
      }
      return "disconnected"
    }
    try {
      const res = await fetch("/api/composio/connection-status")
      const data = await res.json()
      if (data.status === "connected" && data.connectionId) {
        config.connectionId = data.connectionId
        return "connected"
      }
    } catch {
      return "disconnected"
    }
    return "disconnected"
  }

  async getAuthUrl(): Promise<{ url: string; connectionId?: string }> {
    try {
      const res = await fetch("/api/composio/initiate-connection", {
        method: "POST",
      })
      const data = await res.json()
      if (data.redirectUrl) {
        if (config && data.connectionId) config.connectionId = data.connectionId
        return { url: data.redirectUrl, connectionId: data.connectionId }
      }
      if (!res.ok) console.warn("Composio OAuth initiation failed:", data.error)
      return { url: "mock" }
    } catch (error) {
      console.warn("Composio OAuth initiation failed, using mock:", error)
      return { url: "mock" }
    }
  }

  async executeAction(
    actionName: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    this.ensureConfigured()
    if (config?.connectionId) {
      try {
        const res = await fetch("/api/composio/execute-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionName,
            params,
            connectedAccountId: config.connectionId,
          }),
        })
        const body = await res.text()
        if (res.ok) {
          const data = JSON.parse(body)
          if (data && !data.error) return data
        }
        console.warn("Composio API returned error, using mock:", body)
      } catch (e) {
        console.warn("Composio API call failed, using mock:", e)
      }
    }
    return this.executeMockAction(actionName, params)
  }

  private async executeMockAction(
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    await new Promise((r) => setTimeout(r, 600))

    switch (action) {
      case "GMAIL_FETCH_EMAILS": {
        const maxResults = (params.max_results as number) || 10
        const query = params.query as string | undefined
        if (query) {
          return mockEmails.filter(
            (e) =>
              e.subject.toLowerCase().includes(query.toLowerCase()) ||
              e.from.toLowerCase().includes(query.toLowerCase()) ||
              e.body.toLowerCase().includes(query.toLowerCase())
          )
        }
        return mockEmails.slice(0, maxResults)
      }
      case "GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID": {
        const id = params.message_id as string
        return mockEmails.find((e) => e.id === id) || mockEmails[0]
      }
      case "GMAIL_SEND_EMAIL":
      case "GMAIL_CREATE_EMAIL_DRAFT": {
        return { success: true, messageId: "mock-" + Date.now() }
      }
      case "GMAIL_ADD_LABEL_TO_EMAIL":
      case "GMAIL_MOVE_TO_TRASH":
      case "GMAIL_LIST_LABELS": {
        return [
          { id: "INBOX", name: "INBOX" },
          { id: "SENT", name: "SENT" },
          { id: "DRAFT", name: "DRAFT" },
          { id: "STARRED", name: "STARRED" },
          { id: "IMPORTANT", name: "IMPORTANT" },
        ]
      }
      case "GOOGLECALENDAR_EVENTS_LIST": {
        return { items: mockEvents.slice(0, (params.maxResults as number) || 10) }
      }
      case "GOOGLECALENDAR_EVENTS_GET": {
        const id = params.event_id as string
        return mockEvents.find((e) => e.id === id) || mockEvents[0]
      }
      case "GOOGLECALENDAR_CREATE_EVENT": {
        return { id: "mock-event-" + Date.now(), htmlLink: "#" }
      }
      case "GOOGLECALENDAR_DELETE_EVENT": {
        return { success: true }
      }
      default:
        return { success: true }
    }
  }
}

export const gmailIntegration = new GmailIntegration()

// Separate integration for Google Calendar to avoid config conflicts
const CALENDAR_CONFIG_KEY = "voicemail-calendar-config"

class CalendarIntegration {
  private calendarConfig: GmailConfig | null = null

  configure(c: GmailConfig) {
    this.calendarConfig = c
  }

  private ensureConfigured() {
    if (!this.calendarConfig) {
      const stored = typeof window !== "undefined" ? localStorage.getItem(CALENDAR_CONFIG_KEY) : null
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY || ""
          if (apiKey && parsed.connectionId) {
            this.calendarConfig = { apiKey, connectionId: parsed.connectionId }
          }
        } catch {}
      }
    }
  }

  isConfigured() {
    this.ensureConfigured()
    return this.calendarConfig !== null && !!this.calendarConfig.apiKey
  }

  getConnectionId(): string | undefined {
    this.ensureConfigured()
    return this.calendarConfig?.connectionId ?? undefined
  }

  async executeAction(
    actionName: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    this.ensureConfigured()
    if (this.calendarConfig?.connectionId) {
      try {
        const res = await fetch("/api/composio/execute-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionName,
            params,
            connectedAccountId: this.calendarConfig.connectionId,
          }),
        })
        const body = await res.text()
        if (res.ok) {
          const data = JSON.parse(body)
          console.log("[Calendar-Composio] response keys:", Object.keys(data || {}), "typeof data:", typeof data)
          if (data && !data.error) return data
          console.error("Calendar Composio response had error flag:", data)
          return this.executeMockAction(actionName, params)
        }
        console.error("Calendar Composio API error:", res.status, body, body.substring(0, 500))
      } catch (e) {
        console.error("Calendar Composio API call failed:", e)
      }
    }
    return this.executeMockAction(actionName, params)
  }

  private async executeMockAction(
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    await new Promise((r) => setTimeout(r, 600))

    switch (action) {
      case "GOOGLECALENDAR_EVENTS_LIST": {
        return { items: mockEvents.slice(0, (params.maxResults as number) || 10) }
      }
      case "GOOGLECALENDAR_EVENTS_GET": {
        const id = params.event_id as string
        return mockEvents.find((e) => e.id === id) || mockEvents[0]
      }
      case "GOOGLECALENDAR_CREATE_EVENT": {
        return { id: "mock-event-" + Date.now(), htmlLink: "#" }
      }
      case "GOOGLECALENDAR_DELETE_EVENT": {
        return { success: true }
      }
      default:
        return { success: true }
    }
  }
}

export const calendarIntegration = new CalendarIntegration()

const mockEvents = [
  {
    id: "event-1",
    summary: "Team Standup",
    description: "Daily sync with the engineering team",
    location: "Conference Room A",
    startDateTime: new Date(Date.now() + 3600000).toISOString(),
    endDateTime: new Date(Date.now() + 5400000).toISOString(),
    calendarId: "primary",
  },
  {
    id: "event-2",
    summary: "Product Review Meeting",
    description: "Review Q3 product roadmap and milestones",
    location: "Zoom Meeting",
    startDateTime: new Date(Date.now() + 7200000).toISOString(),
    endDateTime: new Date(Date.now() + 10800000).toISOString(),
    calendarId: "primary",
  },
  {
    id: "event-3",
    summary: "Lunch with Sarah",
    description: "Catch up over lunch at the Italian place",
    location: "Olive Garden Downtown",
    startDateTime: new Date(Date.now() + 18000000).toISOString(),
    endDateTime: new Date(Date.now() + 21600000).toISOString(),
    calendarId: "primary",
  },
  {
    id: "event-4",
    summary: "Gym Session",
    description: "Leg day workout",
    location: "Fitness Center",
    startDateTime: new Date(Date.now() + 43200000).toISOString(),
    endDateTime: new Date(Date.now() + 46800000).toISOString(),
    calendarId: "primary",
  },
  {
    id: "event-5",
    summary: "Client Presentation",
    description: "Present Q4 proposal to Acme Corp",
    location: "Main Boardroom",
    startDateTime: new Date(Date.now() + 86400000).toISOString(),
    endDateTime: new Date(Date.now() + 90000000).toISOString(),
    calendarId: "primary",
  },
]

const mockEmails: Email[] = [
  {
    id: "msg-1",
    threadId: "thread-1",
    subject: "Q4 Financial Report",
    from: "sarah.chen@company.com",
    to: "user@example.com",
    body: "Hi team,\n\nAttached is the Q4 financial report. Revenue is up 23% compared to last year. Key highlights include strong performance in the APAC region and new product launches.\n\nBest,\nSarah",
    snippet: "Attached is the Q4 financial report. Revenue is up 23%...",
    date: "2026-07-23T09:15:00Z",
    isRead: false,
    isStarred: true,
    labels: ["INBOX", "IMPORTANT"],
  },
  {
    id: "msg-2",
    threadId: "thread-2",
    subject: "Stripe Invoice - June 2026",
    from: "invoices@stripe.com",
    to: "user@example.com",
    body: "Your invoice for June 2026 is now available.\n\nAmount: $299.00\nDue Date: July 15, 2026\n\nView and pay your invoice at https://stripe.com/invoices/xyz\n\nThank you for your business.",
    snippet: "Your invoice for June 2026 is now available. Amount: $299.00...",
    date: "2026-07-20T14:30:00Z",
    isRead: true,
    isStarred: false,
    labels: ["INBOX"],
  },
  {
    id: "msg-3",
    threadId: "thread-3",
    subject: "This Week's Newsletter",
    from: "newsletter@techweekly.com",
    to: "user@example.com",
    body: "Top stories this week:\n\n1. AI Breakthroughs in Healthcare\n2. New Framework Releases\n3. Industry Conference Updates\n\nRead more on our website.",
    snippet: "Top stories this week: 1. AI Breakthroughs in Healthcare...",
    date: "2026-07-22T08:00:00Z",
    isRead: false,
    isStarred: false,
    labels: ["INBOX"],
  },
  {
    id: "msg-4",
    threadId: "thread-4",
    subject: "Re: Project Alpha Timeline",
    from: "mike.johnson@company.com",
    to: "user@example.com",
    body: "Thanks for the update. The timeline looks good. Let's aim for the August 15th launch date. I'll coordinate with the design team on the remaining UI elements.\n\nMike",
    snippet: "Thanks for the update. The timeline looks good...",
    date: "2026-07-21T16:45:00Z",
    isRead: true,
    isStarred: false,
    labels: ["INBOX"],
  },
  {
    id: "msg-5",
    threadId: "thread-5",
    subject: "Important: Security Update Required",
    from: "security@company.com",
    to: "user@example.com",
    body: "Please update your password before July 30th as part of our quarterly security review. Use the company portal to set a new password.\n\nIT Security Team",
    snippet: "Please update your password before July 30th...",
    date: "2026-07-19T10:00:00Z",
    isRead: false,
    isStarred: false,
    labels: ["INBOX", "IMPORTANT"],
  },
  {
    id: "msg-6",
    threadId: "thread-6",
    subject: "Your Amazon Order #A23-4567-8901",
    from: "ship-confirm@amazon.com",
    to: "user@example.com",
    body: "Your package has shipped!\n\nItems: Wireless Headphones\nDelivery Date: July 25\nTracking: 1Z999AA10123456784\n\nTrack your package: https://amazon.com/tracking",
    snippet: "Your package has shipped! Items: Wireless Headphones...",
    date: "2026-07-22T20:15:00Z",
    isRead: true,
    isStarred: false,
    labels: ["INBOX"],
  },
  {
    id: "msg-7",
    threadId: "thread-7",
    subject: "Team Lunch Tomorrow",
    from: "emma.wilson@company.com",
    to: "user@example.com",
    body: "Hey everyone,\n\nLet's do team lunch tomorrow at 12:30pm. I've booked a table at Olive Garden downtown. Let me know if you have any dietary restrictions.\n\nEmma",
    snippet: "Let's do team lunch tomorrow at 12:30pm...",
    date: "2026-07-22T11:30:00Z",
    isRead: false,
    isStarred: false,
    labels: ["INBOX"],
  },
  {
    id: "msg-8",
    threadId: "thread-8",
    subject: "Invitation: Product Demo",
    from: "alex@partner-company.com",
    to: "user@example.com",
    body: "You're invited to join us for a live demo of our new platform.\n\nDate: July 28, 2026\nTime: 2:00 PM EST\n\nRegister here: https://partner-company.com/demo\n\nBest,\nAlex",
    snippet: "You're invited to join us for a live demo...",
    date: "2026-07-18T15:00:00Z",
    isRead: true,
    isStarred: true,
    labels: ["INBOX"],
  },
  {
    id: "msg-9",
    threadId: "thread-9",
    subject: "Daily Standup Notes - July 22",
    from: "jane.doe@company.com",
    to: "user@example.com",
    body: "Standup Notes:\n- Yesterday: Completed API integration, fixed login bug\n- Today: Starting on dashboard UI, code review pending\n- Blockers: Waiting for design mockups",
    snippet: "Standup Notes: - Yesterday: Completed API integration...",
    date: "2026-07-22T09:00:00Z",
    isRead: false,
    isStarred: false,
    labels: ["INBOX"],
  },
  {
    id: "msg-10",
    threadId: "thread-10",
    subject: "Vacation Request Approved",
    from: "hr@company.com",
    to: "user@example.com",
    body: "Your vacation request for August 10-14 has been approved.\n\nRemaining PTO days: 12\n\nEnjoy your time off!",
    snippet: "Your vacation request for August 10-14 has been approved...",
    date: "2026-07-17T13:00:00Z",
    isRead: true,
    isStarred: false,
    labels: ["INBOX"],
  },
]
