import { calendarIntegration } from "./composio"
import type { ToolResult } from "@/types"

function getLocalTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function formatTime(isoString: string, isAllDay: boolean): string {
  if (!isoString) return "unknown time"
  if (isAllDay) {
    const [y, m, d] = isoString.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }
  // Strip the timezone offset so it parses as a "local" time
  // This ensures the formatted time strictly matches the numbers in the ISO string
  const localTimeStr = isoString.replace(/[+-]\d{2}:\d{2}$/, "").replace(/Z$/i, "")
  const date = new Date(localTimeStr)
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function todayDateLocal(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function addLocalTimes(items: any[]): any[] {
  if (!items) return []
  console.log("[Calendar] Raw items count:", items.length)
  return items.map((event: any) => {
    const start = event.start || event
    const end = event.end || event
    const isAllDay = !!start.date
    const dateStr = start.dateTime || start.date || event.startDateTime || event.start || ""
    const endStr = end.dateTime || end.date || event.endDateTime || event.end || ""
    console.log("[Calendar] Event:", event.summary, "| raw start:", dateStr, "| raw end:", endStr)
    const result = {
      summary: event.summary || "Untitled",
      location: event.location || "",
      description: event.description || "",
      date: formatTime(dateStr, isAllDay),
      endTime: formatTime(endStr, isAllDay),
      id: event.id,
    }
    console.log("[Calendar] Event:", result.summary, "| date:", result.date, "| end:", result.endTime)
    return result
  })
}

export class GoogleCalendarService {
  private extractEvents(data: any): any[] {
    if (!data) return []
    // Composio returns: {"data": [...], "error": null, "successful": true, "logId": "..."}
    if (data.data && Array.isArray(data.data)) {
      console.log("[Calendar] Composio response structure: 'data' contains items, count:", data.data.length)
      return data.data
    }
    // Fallback for other shapes
    if (Array.isArray(data)) return data
    if (data.items) return data.items
    if (data.data?.items) return data.data.items
    if (data.response?.items) return data.response.items
    if (data.result?.items) return data.result.items
    if (data.kind?.startsWith("calendar#") && data.items) return data.items
    console.log("[Calendar] extractEvents: could not extract items, data keys:", Object.keys(data))
    return []
  }

  async getEvents(maxResults = 50): Promise<ToolResult> {
    try {
      const now = new Date()
      // Start from yesterday to catch timezone skew
      const timeMin = new Date(now.setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000).toISOString()

      const response = await calendarIntegration.executeAction("GOOGLECALENDAR_EVENTS_LIST", {
        calendarId: "primary",
        timeMin,
        singleEvents: true,
        orderBy: "startTime",
        maxResults,
      })

      const data = response as any
      console.log("[Calendar] executeAction response keys:", Object.keys(data))
      const items = this.extractEvents(data)
      return { success: true, data: { items: addLocalTimes(items) } }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getEvent(eventId: string): Promise<ToolResult> {
    try {
      const response = await calendarIntegration.executeAction("GOOGLECALENDAR_EVENTS_GET", {
        event_id: eventId,
        calendarId: "primary",
      })
      console.log("[Calendar] getEvent response keys:", Object.keys(response as any || {}))
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async createEvent(summary: string, startDateTime: string, endDateTime: string, description?: string, location?: string): Promise<ToolResult> {
    try {
      const response = await calendarIntegration.executeAction("GOOGLECALENDAR_CREATE_EVENT", {
        summary,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        description: description || "",
        location: location || "",
        calendarId: "primary",
      })
      console.log("[Calendar] createEvent response keys:", Object.keys(response as any || {}))
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async deleteEvent(eventId: string): Promise<ToolResult> {
    try {
      const response = await calendarIntegration.executeAction("GOOGLECALENDAR_DELETE_EVENT", {
        event_id: eventId,
        calendarId: "primary",
      })
      console.log("[Calendar] deleteEvent response keys:", Object.keys(response as any || {}))
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async searchEvents(query: string): Promise<ToolResult> {
    try {
      const now = new Date()
      const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const response = await calendarIntegration.executeAction("GOOGLECALENDAR_EVENTS_LIST", {
        calendarId: "primary",
        timeMin,
        q: query,
        singleEvents: true,
        orderBy: "startTime",
      })

      const data = response as any
      console.log("[Calendar] searchEvents raw response keys:", Object.keys(data || {}))
      let items = this.extractEvents(data)
      items = items.filter((e: any) => {
        const start = e.start || e
        const rawDate = start.dateTime || start.date || e.startDateTime || e.start || ""
        if (!rawDate) return false
        const localTimeStr = rawDate.replace(/[+-]\d{2}:\d{2}$/, "").replace(/Z$/i, "")
        const dateObj = new Date(localTimeStr)
        return !isNaN(dateObj.getTime())
      })
      return { success: true, data: { items: addLocalTimes(items) } }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async getTodayEvents(): Promise<ToolResult> {
    try {
      const today = todayDateLocal()
      // Expand by 24h to avoid excluding events with large timezone offsets
      const timeMin = new Date(new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000).toISOString()
      const timeMax = new Date(new Date().setHours(23, 59, 59, 999) + 24 * 60 * 60 * 1000).toISOString()

      const response = await calendarIntegration.executeAction("GOOGLECALENDAR_EVENTS_LIST", {
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 50,
      })

      const data = response as any
      console.log("[Calendar] getTodayEvents response keys:", Object.keys(data || {}))
      let items = this.extractEvents(data)
      items = items.filter((e: any) => {
        const start = e.start || e
        const rawDate = start.dateTime || start.date || e.startDateTime || e.start || ""
        if (!rawDate) return false
        const localTimeStr = rawDate.replace(/[+-]\d{2}:\d{2}$/, "").replace(/Z$/i, "")
        const dateObj = new Date(localTimeStr)
        if (isNaN(dateObj.getTime())) return false
        const localDateStr = new Intl.DateTimeFormat("en-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(dateObj)
        return localDateStr === today
      })
      return { success: true, data: { items: addLocalTimes(items) } }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

export const googleCalendar = new GoogleCalendarService()
