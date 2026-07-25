"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { gmailIntegration } from "@/services/composio"
import type { ConnectionStatus } from "@/types"

const CONFIG_KEY = "voicemail-gmail-config"

export function useGmail() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)
  const isMockRef = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    restoreConnection()
  }, [])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "gmail-connected" && event.data.connectionId) {
        const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY || ""
        gmailIntegration.configure({
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
    const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY || ""
    const stored = localStorage.getItem(CONFIG_KEY)
    let connectionId: string | null = null
    let isMock = false

    if (stored) {
      try {
        const c = JSON.parse(stored)
        connectionId = c.connectionId
        isMock = c.isMock === true
      } catch {
        localStorage.removeItem(CONFIG_KEY)
      }
    }

    if (!connectionId) return

    gmailIntegration.configure({ apiKey, connectionId })

    if (isMock) {
      setStatus("connected")
      return
    }

    const s = await gmailIntegration.getConnectionStatus()
    if (s === "connected") {
      localStorage.setItem(CONFIG_KEY, JSON.stringify({ connectionId }))
    }
    setStatus(s)
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

      gmailIntegration.configure({ apiKey })

      const result = await gmailIntegration.getAuthUrl()
      const authUrl = result.url

      if (!authUrl || authUrl === "mock") {
        gmailIntegration.configure({
          apiKey,
          connectionId: "mock-connection-" + Date.now(),
        })
        isMockRef.current = true
        localStorage.setItem(CONFIG_KEY, JSON.stringify({
          connectionId: "mock-" + Date.now(),
          isMock: true,
        }))
        setStatus("connected")
        setConnecting(false)
        return
      }

      if (result.connectionId) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify({ connectionId: result.connectionId }))
        gmailIntegration.configure({ apiKey, connectionId: result.connectionId })
      }

      const popup = window.open(
        authUrl,
        "Connect Gmail",
        "width=600,height=700,left=200,top=100"
      )

      if (!popup) {
        window.location.href = authUrl
      }
    } catch (err) {
      console.error("Failed to connect Gmail:", err)
      setError(String(err))
      setStatus("disconnected")
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    gmailIntegration.configure({ apiKey: "" })
    localStorage.removeItem(CONFIG_KEY)
    isMockRef.current = false
    setStatus("disconnected")
    setError(null)
  }, [])

  return { status, connecting, error, connect, disconnect }
}
