"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PolarizationMeterProps {
  value: number; // 0..1
  className?: string;
}

const PolarizationMeter = ({ value, className }: PolarizationMeterProps) => {
  const angle = -90 + value * 180; // -90 (low) to 90 (high)
  const clamped = Math.max(0, Math.min(1, value));

  const color =
    clamped > 0.7 ? "#F87171" : clamped > 0.4 ? "#F5A623" : "#34D399";

  return (
    <div className={cn("rounded-xl border border-border bg-[var(--color-surface)] p-4", className)}>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Polarization
      </h3>
      <div className="flex flex-col items-center">
        <svg width="120" height="70" viewBox="0 0 120 70">
          {/* Background arc */}
          <path
            d="M 10 65 A 50 50 0 0 1 110 65"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Colored arc */}
          <motion.path
            d="M 10 65 A 50 50 0 0 1 110 65"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: clamped }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {/* Needle */}
          <motion.line
            x1="60"
            y1="65"
            x2="60"
            y2="20"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ type: "spring", damping: 15 }}
            style={{ transformOrigin: "60px 65px" }}
          />
          <circle cx="60" cy="65" r="4" fill={color} />
        </svg>
        <span
          className="text-lg font-bold font-[family-name:var(--font-data)] mt-1"
          style={{ color }}
        >
          {(clamped * 100).toFixed(0)}%
        </span>
        <div className="flex justify-between w-full mt-1 text-[10px] text-muted-foreground">
          <span>Consensus</span>
          <span>Polarized</span>
        </div>
      </div>
    </div>
  );
};

export default PolarizationMeter;
export { PolarizationMeter };
