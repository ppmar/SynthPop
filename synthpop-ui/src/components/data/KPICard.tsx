"use client";

import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

const KPICard = ({
  label,
  value,
  icon: Icon,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: KPICardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-elevated)]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <AnimatedNumber
        value={value}
        decimals={decimals}
        suffix={suffix}
        prefix={prefix}
        className="text-2xl font-bold text-foreground"
      />
    </div>
  );
};

export default KPICard;
export { KPICard };
