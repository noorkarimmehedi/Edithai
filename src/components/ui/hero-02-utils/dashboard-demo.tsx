"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ThinkingOrb } from "thinking-orbs"
import { LiveWaveform } from "@/components/ui/live-waveform"
import { Typewriter } from "@/components/fancy/text/typewriter"
import { motion } from "motion/react"

const messages = [
  { role: "user", text: "Do I have any unread emails from Sarah?" },
  { role: "assistant", text: "You have 3 unread emails from Sarah. The latest is about the Q4 project timeline — sent 2 hours ago." },
  { role: "user", text: "Summarize it for me." },
  { role: "assistant", text: "Sarah's email covers the Q4 milestones: design review by Oct 15, dev complete by Nov 1, and launch window Nov 15-20. She's flagged the design timeline as tight." },
]

export function DashboardDemo() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (activeIndex >= messages.length) return
    if (messages[activeIndex].role !== "user") return
    const timer = setTimeout(() => {
      setActiveIndex((prev) => prev + 1)
    }, 500)
    return () => clearTimeout(timer)
  }, [activeIndex])

  return (
    <div className="flex w-full max-w-lg flex-col items-center justify-start gap-4 py-0">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-[10px] tracking-wider uppercase">Live Demo</Badge>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-green-500" />
          </span>
          Connected
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex size-24 items-center justify-center">
          <ThinkingOrb state="composing" size={64} speed={1.05} style={{ width: 96, height: 96 }} />
        </div>

        <div className="h-12 w-56 -mt-1">
          <LiveWaveform
            active={true}
            processing={false}
            height={48}
            barWidth={3}
            barGap={2}
            barRadius={1.5}
            fadeEdges={true}
            sensitivity={1.2}
            mode="static"
            className="text-black/60 dark:text-white/60"
          />
        </div>

        <p className="text-xs text-muted-foreground mt-1">Listening...</p>
      </div>

      <div className="flex w-full flex-col gap-2 px-2">
        {messages.map((msg, i) => {
          const isActive = i === activeIndex
          const isPast = i < activeIndex
          
          if (!isActive && !isPast) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {isPast && msg.text}
                {isActive && (
                  msg.role === "user" ? (
                    msg.text
                  ) : (
                    <Typewriter text={[msg.text]} speed={60} waitTime={300} deleteSpeed={20} cursorChar="_" once onComplete={() => setActiveIndex((prev) => prev + 1)} />
                  )
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}