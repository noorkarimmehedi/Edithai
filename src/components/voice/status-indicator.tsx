"use client"

import type { AssistantState } from "@/types"
import { cn } from "@/lib/utils"
import { Mic, Brain, Volume2, Circle } from "lucide-react"

interface StatusIndicatorProps {
  state: AssistantState
}

const stateConfig: Record<
  AssistantState,
  { icon: typeof Mic; label: string; color: string }
> = {
  idle: {
    icon: Circle,
    label: "Idle",
    color: "text-muted-foreground",
  },
  listening: {
    icon: Mic,
    label: "Listening",
    color: "text-emerald-600",
  },
  thinking: {
    icon: Brain,
    label: "Thinking",
    color: "text-amber-600",
  },
  speaking: {
    icon: Volume2,
    label: "Speaking",
    color: "text-blue-600",
  },
}

export function StatusIndicator({ state }: StatusIndicatorProps) {
  const config = stateConfig[state]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "size-1.5 rounded-full",
          config.color.replace("text-", "bg-"),
          state !== "idle" && "animate-pulse"
        )}
      />
      <Icon className={cn("size-3.5", config.color)} />
      <span className={cn("text-xs text-muted-foreground", config.color)}>
        {config.label}
      </span>
    </div>
  )
}
