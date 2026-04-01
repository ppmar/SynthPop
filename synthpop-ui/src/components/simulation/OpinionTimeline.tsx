"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/utils";
import type { StepSnapshot } from "@/types/simulation";

interface OpinionTimelineProps {
  data: StepSnapshot[];
  className?: string;
}

const OpinionTimeline = ({ data, className }: OpinionTimelineProps) => {
  const chartData = data.map((d) => ({
    step: d.step,
    mean: d.mean_opinion,
    upper: d.mean_opinion + Math.sqrt(d.opinion_variance),
    lower: d.mean_opinion - Math.sqrt(d.opinion_variance),
    confidence: d.mean_confidence,
  }));

  return (
    <div className={cn("rounded-xl border border-border bg-[var(--color-surface)] p-4", className)}>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Opinion Timeline
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="step"
            tick={{ fill: "#8B8BA0", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fill: "#8B8BA0", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            tickLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1A26",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#F1F1F4",
            }}
            labelStyle={{ color: "#8B8BA0" }}
          />
          <defs>
            <linearGradient id="varianceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F5A623" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="url(#varianceGrad)"
            fillOpacity={1}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="url(#varianceGrad)"
            fillOpacity={1}
          />
          <Line
            type="monotone"
            dataKey="mean"
            stroke="#F5A623"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#F5A623" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OpinionTimeline;
export { OpinionTimeline };
