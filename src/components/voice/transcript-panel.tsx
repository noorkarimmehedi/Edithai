"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { TranscriptMessage } from "@/types"
import { User, Bot } from "lucide-react"

interface TranscriptPanelProps {
  messages: TranscriptMessage[]
}

export function TranscriptPanel({ messages }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <Bot className="mx-auto size-7 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground/50">
            Tap the microphone to start
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="flex flex-col gap-2 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 rounded-lg px-4 py-3",
              msg.role === "user" ? "bg-secondary" : "bg-muted"
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                msg.role === "user" ? "bg-muted-foreground/15" : "bg-primary/10"
              )}
            >
              {msg.role === "user" ? (
                <User className="size-3.5 text-muted-foreground" />
              ) : (
                <Bot className="size-3.5 text-primary" />
              )}
            </div>
            <div className="flex-1 leading-relaxed">
              <span className="text-xs font-medium text-muted-foreground">
                {msg.role === "user" ? "You" : "Assistant"}
              </span>
              <p className="mt-0.5 text-sm text-foreground">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
