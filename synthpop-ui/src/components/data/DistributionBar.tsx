"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DistributionBarProps {
  forPct: number;
  againstPct: number;
  neutralPct: number;
  className?: string;
  showLabels?: boolean;
}

const DistributionBar = ({
  forPct,
  againstPct,
  neutralPct,
  className,
  showLabels = true,
}: DistributionBarProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--color-subtle)]">
        <motion.div
          className="bg-[var(--color-opinion-against)]"
          initial={{ width: 0 }}
          animate={{ width: `${againstPct}%` }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        />
        <motion.div
          className="bg-[var(--color-opinion-neutral)]"
          initial={{ width: 0 }}
          animate={{ width: `${neutralPct}%` }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.05 }}
        />
        <motion.div
          className="bg-[var(--color-opinion-for)]"
          initial={{ width: 0 }}
          animate={{ width: `${forPct}%` }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.1 }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs font-[family-name:var(--font-data)]">
          <span className="text-[var(--color-opinion-against)]">
            {againstPct.toFixed(0)}% Against
          </span>
          <span className="text-[var(--color-opinion-neutral)]">
            {neutralPct.toFixed(0)}% Neutral
          </span>
          <span className="text-[var(--color-opinion-for)]">
            {forPct.toFixed(0)}% For
          </span>
        </div>
      )}
    </div>
  );
};

export default DistributionBar;
export { DistributionBar };
