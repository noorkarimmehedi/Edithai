"use client";

import { ThinkingOrb } from "thinking-orbs";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { LiveWaveform } from "@/components/ui/live-waveform";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
  assistantState?: "idle" | "listening" | "thinking" | "speaking";
  audioStream?: MediaStream | null;
  lastUserText?: string;
  lastAssistantText?: string;
  isTyping?: boolean;
  isUserFinal?: boolean;
}

export function AIVoiceInput({
  onStart,
  onStop,
  visualizerBars = 48,
  demoMode = false,
  demoInterval = 3000,
  className,
  assistantState = "idle",
  lastUserText = "",
  lastAssistantText = "",
  isTyping = false,
  isUserFinal = false
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDemo, setIsDemo] = useState(demoMode);
  const onStartRef = useRef(onStart);
  const onStopRef = useRef(onStop);
  const timeRef = useRef(time);
  onStartRef.current = onStart;
  onStopRef.current = onStop;
  timeRef.current = time;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!submitted) {
      onStopRef.current?.(timeRef.current);
      setTime(0);
      return;
    }

    onStartRef.current?.();
    const intervalId = setInterval(() => {
      setTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [submitted]);

  useEffect(() => {
    if (!isDemo) return;

    let timeoutId: NodeJS.Timeout;
    const runAnimation = () => {
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, 1000);
      }, demoInterval);
    };

    const initialTimeout = setTimeout(runAnimation, 100);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, [isDemo, demoInterval]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (isDemo) {
      setIsDemo(false);
      setSubmitted(false);
    } else {
      setSubmitted((prev) => !prev);
    }
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col">
        <button
          className={cn(
            "group w-[140px] h-[140px] rounded-xl flex items-center justify-center transition-colors",
            submitted
              ? "bg-none"
              : "bg-none hover:bg-black/10 dark:hover:bg-white/10"
          )}
          type="button"
          onClick={handleClick}
        >
          <ThinkingOrb state="composing" size={64} speed={1.05} style={{ width: 140, height: 140 }} />
        </button>

        <span
          className={cn(
            "font-mono text-sm transition-opacity duration-300 -mt-1 mb-1",
            submitted
              ? "text-black/70 dark:text-white/70"
              : "text-black/30 dark:text-white/30"
          )}
        >
          {formatTime(time)}
        </span>

        <div className="h-16 w-72">
          {isClient && (
            <LiveWaveform
              active={submitted}
              processing={false}
              height={64}
              barWidth={3}
              barGap={2}
              barRadius={1.5}
              fadeEdges={true}
              sensitivity={1.2}
              mode="static"
              className="text-black/60 dark:text-white/60"
            />
          )}
        </div>

        <p className="h-4 text-xs text-black/70 dark:text-white/70">
          {submitted 
            ? assistantState === "listening" 
              ? "Listening..." 
              : assistantState === "thinking"
                ? "Thinking..."
                : assistantState === "speaking"
                  ? "Speaking..."
                  : "Connecting..."
            : "Click to speak"
          }
        </p>

        {submitted && lastAssistantText && (
          <div className="mt-1 w-full max-w-sm px-4 transition-all duration-200">
            <p className="text-sm text-black/80 dark:text-white/80">
              {lastAssistantText}
              {isTyping && <span className="animate-pulse ml-0.5">|</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
