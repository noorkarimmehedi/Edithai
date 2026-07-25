"use client"

import * as React from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import { cn } from "@/lib/utils"

import { Cta, type CtaProps } from "@/components/ui/hero-02-utils/cta"
import { DashboardDemo } from "@/components/ui/hero-02-utils/dashboard-demo"

export interface Hero02Props {
  title: string
  titleLine2?: string
  description: string
  washImage: string
  animation?: "none" | "subtle"
  primaryCTA: CtaProps
  variant?: "standard" | "compact"
}

const variantStyles = {
  standard: {
    section: "pt-28 sm:pt-36 pb-0",
    title: "text-3xl sm:text-4xl md:text-5xl",
    description: "mx-auto max-w-md text-sm sm:text-base",
    header: "gap-5",
    content: "gap-8 sm:gap-10",
  },
  compact: {
    section: "py-14 sm:py-20",
    title: "text-2xl sm:text-3xl md:text-4xl",
    description: "mx-auto max-w-sm text-sm",
    header: "gap-4",
    content: "gap-10 sm:gap-14",
  },
} as const

const wordTransition = { duration: 1, ease: [0.25, 0.1, 0.25, 1] as const }

const wordVariants: Variants = {
  hidden: { filter: "blur(10px)", transform: "translateY(20%)", opacity: 0 },
  visible: { filter: "blur(0)", transform: "translateY(0)", opacity: 1 },
}

const fadeVariants: Variants = {
  hidden: { filter: "blur(10px)", transform: "translateY(20%)", opacity: 0 },
  visible: {
    filter: "blur(0)",
    transform: "translateY(0)",
    opacity: 1,
    transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

const mediaVariants: Variants = {
  hidden: { filter: "blur(10px)", transform: "translateY(20%)", opacity: 0 },
  visible: {
    filter: "blur(0)",
    transform: "translateY(0)",
    opacity: 1,
    transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.4 },
  },
}

export function Hero02({
  title,
  titleLine2,
  description,
  washImage,
  animation = "none",
  primaryCTA,
  variant = "standard",
}: Readonly<Hero02Props>) {
  const reduce = useReducedMotion()
  const animate = animation === "subtle" && !reduce
  const vs = variantStyles[variant]

  const titleWords = title ? title.split(" ") : []

  const titleElement = title && (
    <h1
      className={cn(
        "text-foreground font-serif font-normal tracking-tight text-balance",
        vs.title,
      )}
    >
      {animate ? (
        titleWords.map((word, i) => (
          <React.Fragment key={i}>
            <motion.span
              className="inline-block"
              transition={wordTransition}
              variants={wordVariants}
            >
              {word}
            </motion.span>
            {i < titleWords.length - 1 && " "}
          </React.Fragment>
        ))
      ) : (
        title
      )}
      {titleLine2 && (
        <>
          <br />
          {animate ? (
            titleLine2.split(" ").map((word, i) => (
              <React.Fragment key={i}>
                <motion.span
                  className={cn("inline-block", word === "Edith" && "font-pixelify")}
                  transition={wordTransition}
                  variants={wordVariants}
                >
                  {word}
                </motion.span>
                {i < titleLine2.split(" ").length - 1 && " "}
              </React.Fragment>
            ))
          ) : (
            <>
              {titleLine2.split("Edith").map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="font-pixelify">Edith</span>}
                  {part}
                </React.Fragment>
              ))}
            </>
          )}
        </>
      )}
    </h1>
  )

  const descriptionElement = description && (
    <motion.p
      className={cn("text-muted-foreground", vs.description)}
      variants={animate ? fadeVariants : undefined}
    >
      {description}
    </motion.p>
  )

  const ctaElement = (
    <motion.div variants={animate ? fadeVariants : undefined}>
      <Cta cta={primaryCTA} />
    </motion.div>
  )

  const mediaElement = (
    <motion.div
      variants={animate ? mediaVariants : undefined}
      className="relative w-full overflow-hidden rounded-md outline outline-black/10 dark:outline-white/10"
    >
      {washImage && (
        <img
          src={washImage}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <div className="from-background/30 via-background/10 to-background/40 absolute inset-0 bg-gradient-to-b" />
      <div className="relative flex items-center justify-center px-6 py-4 sm:px-12 sm:py-6 h-[580px]">
        <DashboardDemo />
      </div>
    </motion.div>
  )

  return (
    <section className="bg-background relative isolate w-full overflow-hidden">
      <motion.div
        className={cn(
          "relative z-10 mx-auto flex max-w-6xl flex-col px-6",
          vs.section,
          vs.content,
        )}
        initial={animate ? "hidden" : false}
        animate={animate ? "visible" : undefined}
        transition={{ staggerChildren: 0.04, delayChildren: 0.1 }}
      >
        <div
          className={cn("mx-auto flex max-w-2xl flex-col items-center text-center", vs.header)}
        >
          {titleElement}
          {descriptionElement}
          {ctaElement}
        </div>

        <div className="w-full">
          {mediaElement}
        </div>
      </motion.div>
    </section>
  )
}

export default Hero02
