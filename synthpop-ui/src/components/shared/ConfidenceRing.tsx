"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConfidenceRingProps {
  confidence: number;
  size?: number;
  className?: string;
}

const ConfidenceRing = ({ confidence, size = 40, className }: ConfidenceRingProps) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - confidence);
  const center = size / 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-accent-amber)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-[10px] font-[family-name:var(--font-data)] text-muted-foreground">
        {Math.round(confidence * 100)}
      </span>
    </div>
  );
};

export default ConfidenceRing;
export { ConfidenceRing };
