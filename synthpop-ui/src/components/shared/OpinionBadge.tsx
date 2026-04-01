"use client";

import { cn } from "@/lib/utils";
import { opinionLabel } from "@/lib/colors";

interface OpinionBadgeProps {
  position: number;
  className?: string;
}

const OpinionBadge = ({ position, className }: OpinionBadgeProps) => {
  const label = opinionLabel(position);
  const colorClass =
    position > 0.15
      ? "bg-[var(--color-opinion-for)]/15 text-[var(--color-opinion-for)] border-[var(--color-opinion-for)]/30"
      : position < -0.15
        ? "bg-[var(--color-opinion-against)]/15 text-[var(--color-opinion-against)] border-[var(--color-opinion-against)]/30"
        : "bg-[var(--color-opinion-neutral)]/15 text-[var(--color-opinion-neutral)] border-[var(--color-opinion-neutral)]/30";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium font-[family-name:var(--font-data)]",
        colorClass,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

export default OpinionBadge;
export { OpinionBadge };
