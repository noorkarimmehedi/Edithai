"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { AssistantState, TranscriptMessage, ToolAction } from "@/types"
import { createRealtimeSession } from "@/services/realtime"
import { gmail } from "@/services/gmail"
import { googleCalendar } from "@/services/google-calendar"

export function useVoiceAssistant() {
  const [state, setState] = useState<AssistantState>("idle")
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [actions, setActions] = useState<ToolAction[]>([])
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [lastUserText, setLastUserText] = useState("")
  const [lastAssistantText, setLastAssistantText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isUserFinal, setIsUserFinal] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  const peerRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intentionalStop = useRef(false)





  const addAction = useCallback((action: Omit<ToolAction, "id" | "timestamp">) => {
    const entry: ToolAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    setActions((prev) => [entry, ...prev])
    return entry
  }, [])

  const updateAction = useCallback((id: string, updates: Partial<ToolAction>) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    )
  }, [])

  const addTranscript = useCallback((msg: Omit<TranscriptMessage, "id" | "timestamp">) => {
    const entry: TranscriptMessage = {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    setTranscript((prev) => [...prev, entry])
  }, [])

  const handleToolCall = useCallback(
    async (toolName: string, args: Record<string, unknown>) => {
      const action = addAction({
        type: toolName as ToolAction["type"],
        description: `Executing ${toolName}...`,
        status: "executing",
      })

      try {
        let result: { success: boolean; data?: unknown; error?: string }

        switch (toolName) {
          case "get_emails": {
            result = await gmail.getEmails(args.maxResults as number)
            break
          }
          case "search_emails": {
            result = await gmail.searchEmails(args.query as string)
            break
          }
          case "manage_email": {
            const { action: emailAction, messageId } = args
            switch (emailAction) {
              case "archive": result = await gmail.archiveMessage(messageId as string); break
              case "delete": result = await gmail.deleteMessage(messageId as string); break
              case "mark_read": result = await gmail.markAsRead(messageId as string); break
              case "mark_unread": result = await gmail.markAsUnread(messageId as string); break
              case "star": result = await gmail.starMessage(messageId as string); break
              case "unstar": result = await gmail.unstarMessage(messageId as string); break
              default: result = { success: false, error: `Unknown action: ${emailAction}` }
            }
            break
          }
          case "send_email": {
            const { action: emailAction, to, subject, body } = args
            if (emailAction === "draft") {
              result = await gmail.createDraft(to as string, subject as string, body as string)
            } else {
              result = await gmail.sendEmail(to as string, subject as string, body as string)
            }
            break
          }
          case "get_events": {
            result = await googleCalendar.getEvents(args.maxResults as number)
            break
          }
          case "get_today_events": {
            result = await googleCalendar.getTodayEvents()
            break
          }
          case "search_events": {
            result = await googleCalendar.searchEvents(args.query as string)
            break
          }
          case "create_event": {
            const { summary, startDateTime, endDateTime, description, location } = args
            result = await googleCalendar.createEvent(
              summary as string,
              startDateTime as string,
              endDateTime as string,
              description as string,
              location as string
            )
            break
          }
          case "delete_event": {
            result = await googleCalendar.deleteEvent(args.eventId as string)
            break
          }
          default:
            result = { success: false, error: `Unknown tool: ${toolName}` }
        }

        if (result.success) {
          updateAction(action.id, { status: "success", details: "Completed" })
        } else {
          updateAction(action.id, { status: "error", details: result.error })
        }

        return result
      } catch (error) {
        updateAction(action.id, { status: "error", details: String(error) })
        return { success: false, error: String(error) }
      }
    },
    [addAction, updateAction]
  )

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= 3) {
      console.error("Max reconnect attempts reached")
      setMicError("Connection lost. Please click the mic to reconnect.")
      setState("idle")
      setIsSessionActive(false)
      return
    }

    reconnectAttempts.current++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 8000)
    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})...`)

    reconnectTimer.current = setTimeout(async () => {
      try {
        // Clean up old connection
        if (dataChannelRef.current) dataChannelRef.current.close()
        if (peerRef.current) peerRef.current.close()
        if (audioElRef.current) {
          audioElRef.current.pause()
          audioElRef.current.srcObject = null
        }

        const stream = streamRef.current
        if (!stream) {
          setState("idle")
          return
        }

        const sessionData = await createRealtimeSession()
        const ephemeralKey = sessionData?.value ?? sessionData?.client_secret?.value ?? ""
        if (!ephemeralKey || ephemeralKey === "mock-token-for-development") {
          throw new Error("Failed to get session token for reconnect")
        }

        const pc = new RTCPeerConnection()
        peerRef.current = pc

        const audioEl = document.createElement("audio")
        audioEl.autoplay = true
        audioElRef.current = audioEl

        pc.ontrack = (event) => {
          audioEl.srcObject = event.streams[0]
        }

        stream.getTracks().forEach((track) => {
          pc.addTransceiver(track, { direction: "sendrecv" })
        })

        const dc = pc.createDataChannel("oai-events")
        dataChannelRef.current = dc

        // Reattach same listeners
        dc.addEventListener("open", () => {
          setIsSessionActive(true)
          reconnectAttempts.current = 0
          dc.send(JSON.stringify({ type: "response.create" }))
        })
        dc.addEventListener("close", () => {
          setIsSessionActive(false)
          if (!intentionalStop.current && peerRef.current?.connectionState !== "closed") {
            attemptReconnect()
          }
        })
        dc.addEventListener("error", (e) => console.error("DC error:", e))

        dc.addEventListener("message", async (event) => {
          const msg = JSON.parse(event.data)
          // Reattach same message handler logic
          switch (msg.type) {
            case "response.output_audio_transcript.delta":
              setLastAssistantText((prev) => prev + msg.delta)
              setIsTyping(true)
              break
            case "response.output_audio_transcript.done":
              addTranscript({ role: "assistant", text: msg.transcript })
              setLastAssistantText(msg.transcript)
              setIsTyping(false)
              break
            case "conversation.item.input_audio_transcription.delta":
              setIsUserFinal(false)
              setLastUserText((prev) => prev + (msg.delta || ""))
              break
            case "conversation.item.input_audio_transcription.completed":
              addTranscript({ role: "user", text: msg.transcript })
              setLastUserText(msg.transcript)
              setIsUserFinal(true)
              break
            case "response.function_call_arguments.done": {
              setState("thinking")
              const args = JSON.parse(msg.arguments)
              const result = await handleToolCall(msg.name, args)
              dc.send(JSON.stringify({
                type: "conversation.item.create",
                item: { type: "function_call_output", output: JSON.stringify(result), call_id: msg.call_id },
              }))
              dc.send(JSON.stringify({ type: "response.create" }))
              break
            }
            case "input_audio_buffer.speech_started":
              setState("listening")
              setLastUserText("")
              setIsUserFinal(false)
              setIsTyping(false)
              break
            case "response.audio.started":
              setState("speaking")
              break
            case "response.audio.done":
              setState("listening")
              break
            case "error":
              console.error("Realtime error:", msg.error)
              break
          }
        })

        pc.addEventListener("connectionstatechange", () => {
          if (!intentionalStop.current && (pc.connectionState === "failed" || pc.connectionState === "disconnected")) {
            attemptReconnect()
          }
        })

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
        })

        if (!sdpResponse.ok) throw new Error(`Reconnect failed (${sdpResponse.status})`)

        const answerSdp = await sdpResponse.text()
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp })
        setState("listening")
      } catch (error) {
        console.error("Reconnect failed:", error)
        attemptReconnect()
      }
    }, delay)
  }, [handleToolCall, addTranscript])

  const startSession = useCallback(async () => {
    try {
      setMicError(null)
      setTranscript([])
      setActions([])
      reconnectAttempts.current = 0
      intentionalStop.current = false
      setState("listening")

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        } 
      })
      streamRef.current = stream
      setAudioStream(stream)

      const sessionData = await createRealtimeSession()
      const ephemeralKey = sessionData?.value ?? sessionData?.client_secret?.value ?? ""

      if (!ephemeralKey || ephemeralKey === "mock-token-for-development") {
        const msg = !ephemeralKey
          ? "Failed to create voice session. Check your OPENAI_API_KEY."
          : "Voice interface is in demo mode. Add your OPENAI_API_KEY to .env.local for real voice conversations."
        addTranscript({ role: "assistant", text: msg })
        setState("idle")
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      const pc = new RTCPeerConnection()
      peerRef.current = pc

      const audioEl = document.createElement("audio")
      audioEl.autoplay = true
      audioElRef.current = audioEl

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0]
      }

      stream.getTracks().forEach((track) => {
        pc.addTransceiver(track, { direction: "sendrecv" })
      })

      const dc = pc.createDataChannel("oai-events")
      dataChannelRef.current = dc

      dc.addEventListener("open", () => {
        setIsSessionActive(true)
        reconnectAttempts.current = 0
        // Small delay to let session fully initialize before requesting response
        setTimeout(() => {
          if (dataChannelRef.current?.readyState === "open") {
            dc.send(JSON.stringify({ type: "response.create" }))
          }
        }, 500)
      })

      dc.addEventListener("close", () => {
        console.warn("Data channel closed")
        setIsSessionActive(false)
        if (!intentionalStop.current && peerRef.current?.connectionState !== "closed") {
          attemptReconnect()
        }
      })

      dc.addEventListener("error", (e) => {
        console.error("Data channel error:", e)
      })

      pc.addEventListener("connectionstatechange", () => {
        const state = pc.connectionState
        if (!intentionalStop.current && (state === "failed" || state === "disconnected")) {
          console.warn("Peer connection", state)
          attemptReconnect()
        }
      })

      dc.addEventListener("message", async (event) => {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case "response.output_audio_transcript.delta": {
            setLastAssistantText((prev) => prev + msg.delta)
            setIsTyping(true)
            break
          }
          case "response.output_audio_transcript.done": {
            addTranscript({ role: "assistant", text: msg.transcript })
            setLastAssistantText(msg.transcript)
            setIsTyping(false)
            break
          }
          case "conversation.item.input_audio_transcription.delta": {
            setIsUserFinal(false)
            setLastUserText((prev) => prev + (msg.delta || ""))
            break
          }
          case "conversation.item.input_audio_transcription.completed": {
            addTranscript({ role: "user", text: msg.transcript })
            setLastUserText(msg.transcript)
            setIsUserFinal(true)
            break
          }
          case "response.function_call_arguments.done": {
            setState("thinking")
            const args = JSON.parse(msg.arguments)
            const result = await handleToolCall(msg.name, args)

            dc.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  output: JSON.stringify(result),
                  call_id: msg.call_id,
                },
              })
            )
            dc.send(JSON.stringify({ type: "response.create" }))
            break
          }
          case "input_audio_buffer.speech_started": {
            setState("listening")
            setLastUserText("")
            setIsUserFinal(false)
            setIsTyping(false)
            break
          }
          case "input_audio_buffer.speech_stopped": {
            break
          }
          case "response.audio.started": {
            setState("speaking")
            break
          }
          case "response.audio.done": {
            setState("listening")
            break
          }
          case "error": {
            const errDetail = msg.error || msg
            console.error("Realtime error:", JSON.stringify(errDetail))
            // Ignore transient empty errors during session init
            if (errDetail && Object.keys(errDetail).length > 0) {
              setMicError(`Voice error: ${errDetail.message || errDetail.type || "Unknown error"}`)
            }
            break
          }
        }
      })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime/calls",
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
        }
      )

      if (!sdpResponse.ok) {
        const errBody = await sdpResponse.text().catch(() => "")
        throw new Error(`WebRTC connection failed (${sdpResponse.status}): ${errBody || sdpResponse.statusText}`)
      }

      const answerSdp = await sdpResponse.text()
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      })
    } catch (error) {
      console.error("Session start error:", error)
      setMicError(
        error instanceof Error ? error.message : "Failed to start voice session"
      )
      setState("idle")
      setIsSessionActive(false)
    }
  }, [handleToolCall, addTranscript, attemptReconnect])

  const stopSession = useCallback(() => {
    intentionalStop.current = true
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    if (dataChannelRef.current) dataChannelRef.current.close()
    if (peerRef.current) peerRef.current.close()
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.srcObject = null
    }
    peerRef.current = null
    dataChannelRef.current = null
    streamRef.current = null
    audioElRef.current = null
    setAudioStream(null)
    setIsSessionActive(false)
    setState("idle")
  }, [])

  useEffect(() => {
    return () => stopSession()
  }, [stopSession])

  return {
    state,
    transcript,
    actions,
    isSessionActive,
    micError,
    lastUserText,
    lastAssistantText,
    isTyping,
    isUserFinal,
    audioStream,
    startSession,
    stopSession,
  }
}
