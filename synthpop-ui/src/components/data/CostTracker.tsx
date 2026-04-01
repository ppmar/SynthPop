"use client";

import { Coins } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "@/lib/utils";

interface CostTrackerProps {
  costUsd: number;
  className?: string;
}

const CostTracker = ({ costUsd, className }: CostTrackerProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--color-surface)] px-3 py-1",
        className
      )}
    >
      <Coins className="h-3.5 w-3.5 text-[var(--color-accent-amber)]" />
      <AnimatedNumber
        value={costUsd}
        prefix="$"
        decimals={4}
        className="text-xs text-muted-foreground"
      />
    </div>
  );
};

export default CostTracker;
export { CostTracker };
