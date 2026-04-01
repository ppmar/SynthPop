"use client";

import { cn } from "@/lib/utils";

interface DemographicSliderProps {
  label: string;
  distribution: Record<string, number>;
  onChange: (distribution: Record<string, number>) => void;
  className?: string;
}

const COLORS = [
  "bg-[var(--color-accent-amber)]",
  "bg-[var(--color-opinion-for)]",
  "bg-[var(--color-opinion-against)]",
  "bg-[var(--color-opinion-neutral)]",
  "bg-[var(--color-accent-warm)]",
  "bg-purple-500",
];

const DemographicSlider = ({
  label,
  distribution,
  onChange,
  className,
}: DemographicSliderProps) => {
  const entries = Object.entries(distribution);

  const handleChange = (key: string, newValue: number) => {
    const clamped = Math.max(0, Math.min(1, newValue));
    const others = entries.filter(([k]) => k !== key);
    const remaining = 1 - clamped;
    const othersTotal = others.reduce((sum, [, v]) => sum + v, 0);

    const updated = { ...distribution, [key]: clamped };
    if (othersTotal > 0) {
      for (const [k, v] of others) {
        updated[k] = (v / othersTotal) * remaining;
      }
    }
    onChange(updated);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>

      {/* Distribution bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--color-subtle)]">
        {entries.map(([key, value], i) => (
          <div
            key={key}
            className={cn("transition-all duration-300", COLORS[i % COLORS.length])}
            style={{ width: `${value * 100}%` }}
          />
        ))}
      </div>

      {/* Labels and values */}
      <div className="space-y-1">
        {entries.map(([key, value], i) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full shrink-0", COLORS[i % COLORS.length])} />
            <span className="text-xs text-muted-foreground flex-1 truncate">{key}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(value * 100)}
              onChange={(e) => handleChange(key, parseInt(e.target.value) / 100)}
              className="w-20 h-1 accent-[var(--color-accent-amber)] cursor-pointer"
            />
            <span className="text-xs font-[family-name:var(--font-data)] text-foreground w-10 text-right">
              {(value * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemographicSlider;
export { DemographicSlider };
