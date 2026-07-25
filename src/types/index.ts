export type ConnectionStatus = "connected" | "disconnected" | "connecting";

export type AssistantState = "idle" | "listening" | "thinking" | "speaking";

export interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
}

export interface DraftReply {
  threadId: string;
  originalSubject: string;
  originalFrom: string;
  body: string;
}

export type ToolActionType =
  | "read_emails"
  | "search_emails"
  | "summarize"
  | "draft_reply"
  | "send_reply"
  | "archive"
  | "delete"
  | "mark_read"
  | "mark_unread"
  | "star"
  | "unstar"
  | "get_events"
  | "search_events"
  | "create_event"
  | "delete_event"
  | "get_today_events";

export interface ToolAction {
  id: string;
  type: ToolActionType;
  description: string;
  status: "pending" | "executing" | "success" | "error";
  timestamp: number;
  details?: string;
  requiresConfirmation?: boolean;
  confirmationText?: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  requiresConfirmation?: boolean;
  confirmationText?: string;
}

export interface TranscriptMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface RealtimeTool {
  type: "function"
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface GmailConfig {
  apiKey: string;
  clientId?: string;
  connectionId?: string | null;
}