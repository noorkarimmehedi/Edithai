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
    description: "Get the latest emails from Gmail. Use for general 'what's in my inbox' questions. Optional maxResults (default 10) — pass a higher value (e.g. 25) when the user wants a thorough review of many emails. For filtered requests (unread emails, emails from the last N hours/days, from a specific sender), use search_emails instead. If the result includes a nextPageToken and you need more emails, call again with that pageToken.",
    parameters: {
      type: "object",
      properties: {
        maxResults: { type: "number" },
        pageToken: { type: "string", description: "Opaque token to fetch the next page of results. Pass the nextPageToken returned by the previous call." },
      },
    },
  },
  {
    type: "function",
    name: "search_emails",
    description: "Search Gmail using Gmail query syntax. Supported filters: is:unread, is:read, newer_than:1d (last 24 hours), newer_than:6h, after:YYYY/MM/DD, before:YYYY/MM/DD, from:email, subject:text, in:inbox. Examples: 'is:unread newer_than:1d', 'is:unread after:2026/08/01', 'from:alice@company.com'. Use this for ANY request about unread emails, recent emails (last N hours/days), or filtered email reviews. Read ALL emails returned before answering; do not summarize only the newest few unless they are the only matches. If the result includes a nextPageToken and there may be more matching emails, call again with that pageToken and keep reading until there are no more pages.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        pageToken: { type: "string", description: "Opaque token to fetch the next page of results. Pass the nextPageToken returned by the previous call." },
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
