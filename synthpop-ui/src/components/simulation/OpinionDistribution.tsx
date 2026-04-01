"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AgentOpinion } from "@/types/simulation";

interface OpinionDistributionProps {
  opinions: AgentOpinion[];
  className?: string;
}

const BINS = 20;

const OpinionDistribution = ({ opinions, className }: OpinionDistributionProps) => {
  const data = useMemo(() => {
    const bins = Array.from({ length: BINS }, (_, i) => ({
      range: (-1 + (i * 2) / BINS).toFixed(1),
      count: 0,
      position: -1 + (i * 2) / BINS + 1 / BINS,
    }));
    for (const op of opinions) {
      const pos = op.opinion.position;
      const idx = Math.min(Math.floor(((pos + 1) / 2) * BINS), BINS - 1);
      bins[idx].count++;
    }
    return bins;
  }, [opinions]);

  const barColor = (position: number) => {
    if (position > 0.15) return "#34D399";
    if (position < -0.15) return "#F87171";
    return "#94A3B8";
  };

  return (
    <div className={cn("rounded-xl border border-border bg-[var(--color-surface)] p-4", className)}>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Opinion Distribution
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="range"
            tick={{ fill: "#8B8BA0", fontSize: 9 }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill: "#8B8BA0", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1A26",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#F1F1F4",
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.position)} fillOpacity={0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OpinionDistribution;
export { OpinionDistribution };
