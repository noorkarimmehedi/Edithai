import { gmailIntegration } from "./composio"
import type { DraftReply, ToolResult } from "@/types"

const MAX_EMAILS = 20
const MAX_BODY_CHARS = 300

interface RawEmail {
  messageId?: string
  id?: string
  subject?: string
  sender?: string
  from?: string
  messageTimestamp?: string
  date?: string
  messageText?: string
  body?: string
  snippet?: string
  preview?: string | { body?: string; subject?: string }
  labelIds?: string[]
  labels?: string[]
  isRead?: boolean
}

function compactEmails(raw: unknown): Record<string, unknown>[] {
  let messages: RawEmail[] = []
  if (Array.isArray(raw)) messages = raw as RawEmail[]
  else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>
    const data = obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>) : undefined
    if (Array.isArray(obj.emails)) messages = obj.emails as RawEmail[]
    else if (Array.isArray(obj.messages)) messages = obj.messages as RawEmail[]
    else if (data && Array.isArray(data.messages)) messages = data.messages as RawEmail[]
    else if (Array.isArray(obj.data)) messages = obj.data as RawEmail[]
  }

  return messages.slice(0, MAX_EMAILS).map((m) => {
    const body = (m.messageText ?? m.body ?? m.snippet ?? "") as string
    const truncatedBody = body.length > MAX_BODY_CHARS ? body.substring(0, MAX_BODY_CHARS) + "..." : body
    const labels: string[] = Array.isArray(m.labelIds) ? m.labelIds : Array.isArray(m.labels) ? m.labels : []
    const preview = typeof m.preview === "string" ? m.preview : (m.preview?.body ?? "")
    return {
      id: m.messageId ?? m.id ?? "",
      subject: m.subject ?? "(no subject)",
      from: m.sender ?? m.from ?? "",
      date: m.messageTimestamp ?? m.date ?? "",
      unread: labels.includes("UNREAD") || m.isRead === false,
      labels,
      snippet: preview,
      body: truncatedBody,
    }
  })
}

async function fetchEmails(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const raw = await gmailIntegration.executeAction("GMAIL_FETCH_EMAILS", {
      include_payload: false,
      ...args,
    })
    const emails = compactEmails(raw)
    return { success: true, data: { emails, count: emails.length } }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export class GmailService {
  async getEmails(maxResults = 10): Promise<ToolResult> {
    return fetchEmails({ max_results: maxResults })
  }

  async getEmail(messageId: string): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID", {
        message_id: messageId,
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async searchEmails(query: string): Promise<ToolResult> {
    return fetchEmails({ query, max_results: MAX_EMAILS })
  }

  async sendEmail(to: string, subject: string, body: string): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_SEND_EMAIL", {
        recipient_email: to,
        subject,
        body,
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async createDraft(to: string, subject: string, body: string): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_CREATE_EMAIL_DRAFT", {
        recipient_email: to,
        subject,
        body,
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async archiveMessage(messageId: string): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_ADD_LABEL_TO_EMAIL", {
        message_id: messageId,
        remove_label_ids: ["INBOX"],
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async deleteMessage(messageId: string): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_MOVE_TO_TRASH", {
        message_id: messageId,
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async markAsRead(messageId: string): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_ADD_LABEL_TO_EMAIL", {
        message_id: messageId,
        remove_label_ids: ["UNREAD"],
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async markAsUnread(messageId: string): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_ADD_LABEL_TO_EMAIL", {
        message_id: messageId,
        add_label_ids: ["UNREAD"],
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async starMessage(messageId: string): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_ADD_LABEL_TO_EMAIL", {
        message_id: messageId,
        add_label_ids: ["STARRED"],
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async unstarMessage(messageId: string): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_ADD_LABEL_TO_EMAIL", {
        message_id: messageId,
        remove_label_ids: ["STARRED"],
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async draftReply(reply: DraftReply): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_CREATE_EMAIL_DRAFT", {
        recipient_email: reply.originalFrom,
        subject: `Re: ${reply.originalSubject}`,
        body: reply.body,
        thread_id: reply.threadId,
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async sendReply(reply: DraftReply): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_SEND_EMAIL", {
        recipient_email: reply.originalFrom,
        subject: `Re: ${reply.originalSubject}`,
        body: reply.body,
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

export const gmail = new GmailService()
