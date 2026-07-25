import type { RealtimeTool } from "@/types"

export type { RealtimeTool }

let cachedToken: string | null = null
let cachedTokenExpiry = 0
const TOKEN_TTL_MS = 45_000

export async function createRealtimeSession() {
  const now = Date.now()
  if (cachedToken && now < cachedTokenExpiry) {
    return { value: cachedToken }
  }

  const response = await fetch("/api/realtime/token", {
    method: "POST",
  })
  const data = await response.json()
  if (!response.ok) {
    console.error("Realtime session error:", data.error || "Unknown error")
    return { value: null }
  }

  const token = data?.value ?? data?.client_secret?.value ?? null
  if (token && token !== "mock-token-for-development") {
    cachedToken = token
    cachedTokenExpiry = now + TOKEN_TTL_MS
  }

  return data
}

export function prefetchRealtimeToken() {
  createRealtimeSession()
}

export const calendarTools: RealtimeTool[] = [
  {
    type: "function",
    name: "get_events",
    description: "Get calendar events from Google Calendar. Use when the user asks about their schedule or events on a specific day (like 'tomorrow' or 'next week'). ALWAYS specify timeMin and timeMax in ISO 8601 format with +06:00 offset (e.g. 2026-07-26T00:00:00+06:00) if the user asks for a specific timeframe. Optional maxResults.",
    parameters: {
      type: "object",
      properties: {
        timeMin: { type: "string", description: "Start of the time range in ISO 8601 format with +06:00 offset." },
        timeMax: { type: "string", description: "End of the time range in ISO 8601 format with +06:00 offset." },
        maxResults: { type: "number" },
      },
    },
  },
  {
    type: "function",
    name: "get_today_events",
    description: "Get all of today's calendar events from Google Calendar. Use when the user asks what's happening today. Each event has 'summary', 'date', and 'endTime' — read these directly. List ALL events.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    type: "function",
    name: "search_events",
    description: "Search calendar events by keyword. Use when the user asks to find specific events. Each event has 'summary', 'date', and 'endTime' — read these directly. List ALL events found.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "create_event",
    description: "Create a new calendar event. Use when the user wants to schedule something. The user is in Asia/Dhaka (UTC+7). Requires summary, startDateTime, and endDateTime in ISO format with +07:00 offset (e.g. 2026-07-24T14:00:00+07:00). Optional description and location.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string" },
        startDateTime: { type: "string" },
        endDateTime: { type: "string" },
        description: { type: "string" },
        location: { type: "string" },
      },
      required: ["summary", "startDateTime", "endDateTime"],
    },
  },
  {
    type: "function",
    name: "delete_event",
    description: "Delete a calendar event from the user's Google Calendar. Use this when the user wants to cancel or remove an event. Requires the eventId.",
    parameters: {
      type: "object",
      properties: {
        eventId: { type: "string" },
      },
      required: ["eventId"],
    },
  },
  {
    type: "function",
    name: "edit_event",
    description: "Edit or update an existing calendar event. Use this when the user wants to change the time, date, or title of an event. Requires the eventId AND the summary (title). IMPORTANT: You MUST ALWAYS pass the original summary (title) of the event even if you are only changing the date/time, otherwise the title will be erased!",
    parameters: {
      type: "object",
      properties: {
        eventId: { type: "string", description: "The ID of the event to update." },
        summary: { type: "string", description: "The title of the event. YOU MUST ALWAYS PROVIDE THIS." },
        startDateTime: { type: "string", description: "New start time in ISO 8601 format with +06:00 offset (e.g. 2026-07-27T16:00:00+06:00)." },
        endDateTime: { type: "string", description: "New end time in ISO 8601 format with +06:00 offset (e.g. 2026-07-27T17:00:00+06:00)." },
        description: { type: "string" },
        location: { type: "string" },
      },
      required: ["eventId", "summary"],
    },
  },
]

export const gmailTools: RealtimeTool[] = [
  {
    type: "function",
    name: "get_emails",
    description: "Get latest emails. Optional maxResults (default 10).",
    parameters: {
      type: "object",
      properties: {
        maxResults: { type: "number" },
      },
    },
  },
  {
    type: "function",
    name: "search_emails",
    description: "Search inbox by query.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "manage_email",
    description: "Perform action on email. action: archive, delete, mark_read, mark_unread, star, unstar. Requires messageId.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["archive", "delete", "mark_read", "mark_unread", "star", "unstar"] },
        messageId: { type: "string" },
      },
      required: ["action", "messageId"],
    },
  },
  {
    type: "function",
    name: "send_email",
    description: "Send or draft email. action: send or draft. Requires to, subject, body.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["send", "draft"] },
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["action", "to", "subject", "body"],
    },
  },
]
