"use client";

import React, { useEffect, useState } from "react";

const ACCENT = "oklch(85.2% 0.199 91.936)";
const PHASE_DURATIONS = [60, 50, 40, 30, 20, 10];
const TOTAL_FIRST_PHASES = PHASE_DURATIONS.reduce((a, b) => a + b, 0); // 210

function getPhaseInfo(elapsedSeconds: number): {
  remaining: number;
  phaseDuration: number;
} {
  if (elapsedSeconds < 0) {
    return { remaining: 60, phaseDuration: 60 };
  }

  // First 210 seconds: 60, 50, 40, 30, 20, 10
  if (elapsedSeconds < TOTAL_FIRST_PHASES) {
    let cumulative = 0;
    for (const d of PHASE_DURATIONS) {
      if (elapsedSeconds < cumulative + d) {
        const remaining = Math.ceil(d - (elapsedSeconds - cumulative));
        return { remaining: Math.max(0, remaining), phaseDuration: d };
      }
      cumulative += d;
    }
  }

  // After 210s: repeat 10s phases
  const overtime = elapsedSeconds - TOTAL_FIRST_PHASES;
  const inCurrentPhase = overtime % 10;
  const remaining = Math.ceil(10 - inCurrentPhase);
  return { remaining: Math.max(0, remaining), phaseDuration: 10 };
}

interface ProcessingCountdownProps {
  sessionStartTime: number;
  size?: number;
  strokeWidth?: number;
}

export function ProcessingCountdown({
  sessionStartTime,
  size = 40,
  strokeWidth = 3,
}: ProcessingCountdownProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => {
      const elapsedMs = Date.now() - sessionStartTime;
      setElapsed(elapsedMs / 1000);
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [sessionStartTime]);

  const { remaining, phaseDuration } = getPhaseInfo(elapsed);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = phaseDuration > 0 ? remaining / phaseDuration : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Processing, about ${remaining} seconds remaining`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="opacity-20"
          style={{ color: ACCENT }}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ACCENT}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] duration-500 ease-linear"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums"
        style={{ color: ACCENT }}
      >
        {remaining}
      </span>
    </div>
  );
}
