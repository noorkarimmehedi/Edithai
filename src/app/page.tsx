"use client"

import { motion, useScroll, useTransform } from "motion/react"
import { Hero02 } from "@/components/ui/hero-02"

export default function Home() {
  const { scrollYProgress } = useScroll()
  const footerProgress = useTransform(scrollYProgress, [0.65, 0.88], [0, 1])
  const linksOpacity = useTransform(footerProgress, [0, 0.4, 1], [0, 0, 1])
  const linksBlur = useTransform(footerProgress, [0, 0.4, 1], ["8px", "8px", "0px"])
  const logoOpacity = useTransform(footerProgress, [0, 0.6, 1], [0, 0, 1])
  const logoBlur = useTransform(footerProgress, [0, 0.6, 1], ["8px", "8px", "0px"])
  return (
    <div className="relative">
      <div className="relative z-10 bg-background">
        <Hero02
          title="Your AI-Powered"
          titleLine2="Voice Assistant Edith"
          description="Manage your emails, calendar, and tasks with natural voice conversations."
          washImage="https://images.unsplash.com/photo-1578301978018-3005759f48f7?q=80&w=1144&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          animation="subtle"
          primaryCTA={{
            ctaEnabled: true,
            text: 'Talk to "Edith"',
            link: "/assistant",
            variant: "default",
            size: "lg",
          }}
        />
      </div>

      <div className="sticky bottom-0 left-0 z-0 w-full bg-background">
        <div className="relative mx-auto w-full max-w-6xl">
          <motion.div
            style={{ opacity: linksOpacity, filter: linksBlur }}
            className="flex items-end justify-end px-6 pt-56 pb-8"
          >
            <div className="flex gap-16 sm:gap-24">
              <ul className="space-y-2">
                <li className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <a href="/assistant">Assistant</a>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <a href="#">X (Twitter)</a>
                </li>
              </ul>
            </div>
          </motion.div>
          <motion.div
            style={{ opacity: logoOpacity, filter: logoBlur }}
            className="absolute bottom-0 left-0 overflow-hidden pl-3 pointer-events-none select-none"
          >
            <h2 className="text-[clamp(4rem,20vw,12rem)] font-bold leading-[0.8] text-foreground/5 font-pixelify">
              Edith
            </h2>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
