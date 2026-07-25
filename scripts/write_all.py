import os

BASE = "/Users/noorkarimmehedi/Downloads/untitled folder 5/voicemail-ai"

files = {}

files["src/services/composio.ts"] = '''
import type { ConnectionStatus, Email, ToolResult } from "@/types";

interface GmailConnection {
  status: ConnectionStatus;
  email?: string;
  connectionId?: string;
}

class ComposioService {
  private static instance: ComposioService;
  private connection: GmailConnection = { status: "disconnected" };
  private useMock = true;

  static getInstance(): ComposioService {
    if (!ComposioService.instance) {
      ComposioService.instance = new ComposioService();
    }
    return ComposioService.instance;