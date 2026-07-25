"use client"

import * as React from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CtaProps {
  ctaEnabled?: boolean
  text?: string
  link?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"
}

export function Cta({ cta }: { cta: CtaProps }) {
  if (!cta.ctaEnabled) return null

  return (
    <Link
      href={cta.link || "#"}
      className={cn(buttonVariants({ variant: cta.variant, size: cta.size }))}
    >
      {cta.text?.split("Edith").map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="font-pixelify">Edith</span>}
          {part}
        </React.Fragment>
      ))}
    </Link>
  )
}
