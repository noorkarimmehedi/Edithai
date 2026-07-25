"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { ToolAction } from "@/types"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Search,
  FileText,
  Send,
  Archive,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Reply,
} from "lucide-react"

interface ActivityPanelProps {
  actions: ToolAction[]
}

const actionIcons: Record<string, typeof Mail> = {
  get_emails: Mail,
  search_emails: Search,
  summarize_emails: FileText,
  draft_reply: Reply,
  send_reply: Send,
  archive_email: Archive,
  delete_email: Trash2,
  star_email: Star,
  unstar: Star,
  mark_as_read: Eye,
  mark_as_unread: EyeOff,
}

function formatActionType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ActivityPanel({ actions }: ActivityPanelProps) {
  if (actions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <Clock className="mx-auto size-5 text-muted-foreground/30" />
          <p className="mt-2 text-xs text-muted-foreground/50">
            No actions yet
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col p-3">
        {actions.map((action) => {
          const Icon = actionIcons[action.type] || Mail

          return (
            <div
              key={action.id}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm",
                action.status === "executing" && "bg-secondary",
                action.status === "error" && "bg-red-50"
              )}
            >
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {formatActionType(action.type)}
                  </span>
                  {action.status === "executing" && (
                    <Loader2 className="size-3 animate-spin text-amber-500" />
                  )}
                  {action.status === "success" && (
                    <CheckCircle2 className="size-3 text-emerald-500" />
                  )}
                  {action.status === "error" && (
                    <XCircle className="size-3 text-destructive" />
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {action.description}
                </p>
                {action.details && (
                  <p className="mt-0.5 text-xs text-muted-foreground/60">
                    {action.details}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
