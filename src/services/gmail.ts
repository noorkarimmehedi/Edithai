import { gmailIntegration } from "./composio"
import type { DraftReply, ToolResult } from "@/types"

export class GmailService {
  async getEmails(maxResults = 10): Promise<ToolResult> {
    try {
      const data = await gmailIntegration.executeAction("GMAIL_FETCH_EMAILS", {
        max_results: maxResults,
        include_payload: false,
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
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
    try {
      const data = await gmailIntegration.executeAction("GMAIL_FETCH_EMAILS", {
        query,
        include_payload: false,
      })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: String(error) }
    }
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
