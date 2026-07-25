import os, json

BASE = "/Users/noorkarimmehedi/Downloads/untitled folder 5/voicemail-ai"

# Each file: path -> content (base64 encoded to avoid shell issues)
FILES_B64 = {}

# We'll build files as dict of path -> content directly
FILES = {}

FILES["src/types/index.ts"] = """export type ConnectionStatus = "connected" | "disconnected" | "connecting";

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
  labels