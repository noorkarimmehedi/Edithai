"use client"

import { cn } from "@/lib/utils"
import type { AssistantState } from "@/types"
import { Mic, Square } from "lucide-react"

interface VoiceButtonProps {
  state: AssistantState
  isSessionActive: boolean
  onStart: () => void
  onStop: () => void
}

export function VoiceButton({
  state,
  isSessionActive,
  onStart,
  onStop,
}: VoiceButtonProps) {
  const isActive = isSessionActive

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={cn(
          "absolute size-24 rounded-full transition-all duration-500",
          isActive && state === "listening" && "animate-ping bg-emerald-500/15",
          isActive && state === "thinking" && "animate-ping bg-amber-500/15",
          isActive && state === "speaking" && "animate-ping bg-blue-500/15"
        )}
      />
      <button
        onClick={isActive ? onStop : onStart}
        className={cn(
          "relative z-10 flex size-14 items-center justify-center rounded-full transition-all duration-200",
          "border-2",
          "hover:scale-105 active:scale-95",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive
            ? "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20"
            : "border-border bg-card text-foreground hover:bg-muted"
        )}
        aria-label={isActive ? "Stop conversation" : "Start conversation"}
      >
        {isActive ? (
          <Square className="size-5 fill-current" />
        ) : (
          <Mic className="size-5" />
        )}
      </button>
    </div>
  )
}
