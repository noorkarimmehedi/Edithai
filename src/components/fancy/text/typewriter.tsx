"use client"

import { useEffect, useState } from "react"

interface TypewriterProps {
  text: string[]
  speed?: number
  waitTime?: number
  deleteSpeed?: number
  cursorChar?: string
  className?: string
  once?: boolean
  onComplete?: () => void
}

export function Typewriter({
  text,
  speed = 50,
  waitTime = 1000,
  deleteSpeed = 30,
  cursorChar = "|",
  className = "",
  once = false,
  onComplete,
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState("")
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return

    const currentWord = text[wordIndex % text.length]

    if (!isDeleting && charIndex < currentWord.length) {
      const timer = setTimeout(() => {
        setDisplayed((prev) => prev + currentWord[charIndex])
        setCharIndex((prev) => prev + 1)
      }, speed)
      return () => clearTimeout(timer)
    }

    if (!isDeleting && charIndex >= currentWord.length) {
      const lastWord = wordIndex >= text.length - 1
      if (once && lastWord) {
        setDone(true)
        onComplete?.()
        return
      }
      const timer = setTimeout(() => {
        setIsDeleting(true)
      }, waitTime)
      return () => clearTimeout(timer)
    }

    if (isDeleting && charIndex > 0) {
      const timer = setTimeout(() => {
        setDisplayed((prev) => prev.slice(0, -1))
        setCharIndex((prev) => prev - 1)
      }, deleteSpeed)
      return () => clearTimeout(timer)
    }

    if (isDeleting && charIndex === 0) {
      setIsDeleting(false)
      setWordIndex((prev) => prev + 1)
      setDisplayed("")
    }
  }, [charIndex, isDeleting, wordIndex, text, speed, waitTime, deleteSpeed, once, done, onComplete])

  return (
    <span className={className}>
      {displayed}
      {(!done || !once) && <span>{cursorChar}</span>}
    </span>
  )
}
