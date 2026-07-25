"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { calendarIntegration } from "@/services/composio"
import type { ConnectionStatus } from "@/types"

const CONFIG_KEY = "voicemail-calendar-config"

export function useGoogleCalendar() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    restoreConnection()
  }, [])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "calendar-connected" && event.data.connectionId) {
        const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY || ""
        calendarIntegration.configure({
          apiKey,
          connectionId: event.data.connectionId,
        })
        localStorage.setItem(CONFIG_KEY, JSON.stringify({ connectionId: event.data.connectionId }))
        setStatus("connected")
        setConnecting(false)
        setError(null)
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  const restoreConnection = useCallback(async () => {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (!stored) return

    try {
      const c = JSON.parse(stored)
      const connectionId = c.connectionId
      if (!connectionId) return

      const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY || ""
      calendarIntegration.configure({ apiKey, connectionId })
      setStatus("connected")
    } catch {
      localStorage.removeItem(CONFIG_KEY)
    }
  }, [])

  const connect = useCallback(async () => {
    setConnecting(true)
    setStatus("connecting")
    setError(null)

    try {
      const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY

      if (!apiKey) {
        setError("API key not configured")
        setStatus("disconnected")
        setConnecting(false)
        return
      }

      const response = await fetch("/api/composio/initiate-calendar-connection", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate connection")
      }

      const redirectUrl = data.redirectUrl

      if (!redirectUrl) {
        throw new Error("No redirect URL received")
      }

      if (data.connectionId) {
        calendarIntegration.configure({ apiKey, connectionId: data.connectionId })
        localStorage.setItem(CONFIG_KEY, JSON.stringify({ connectionId: data.connectionId }))
      }

      const popup = window.open(
        redirectUrl,
        "Connect Google Calendar",
        "width=600,height=700,left=200,top=100"
      )

      if (!popup) {
        window.location.href = redirectUrl
      }
    } catch (err) {
      console.error("Failed to connect Google Calendar:", err)
      setError(String(err))
      setStatus("disconnected")
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem(CONFIG_KEY)
    setStatus("disconnected")
    setError(null)
  }, [])

  return { status, connecting, error, connect, disconnect }
}
