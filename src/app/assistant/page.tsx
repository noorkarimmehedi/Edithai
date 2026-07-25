"use client"

import { useVoiceAssistant } from "@/hooks/use-voice-assistant"
import { AIVoiceInput } from "@/components/ui/ai-voice-input"
import { AlertTriangle } from "lucide-react"

export default function AssistantPage() {
  const {
    state,
    micError,
    lastUserText,
    lastAssistantText,
    isTyping,
    isUserFinal,
    audioStream,
    startSession,
    stopSession,
  } = useVoiceAssistant()

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      {micError && (
        <div className="fixed inset-x-4 top-16 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-xs">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      <AIVoiceInput
        onStart={() => startSession()}
        onStop={() => stopSession()}
        audioStream={audioStream}
        assistantState={state}
        lastUserText={lastUserText}
        lastAssistantText={lastAssistantText}
        isTyping={isTyping}
        isUserFinal={isUserFinal}
      />
    </div>
  )
}
