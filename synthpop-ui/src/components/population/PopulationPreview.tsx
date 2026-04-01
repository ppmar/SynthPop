"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Persona } from "@/types/persona";

interface PopulationPreviewProps {
  agents: Persona[];
  className?: string;
}

const MiniBar = ({ label, data }: { label: string; data: Record<string, number> }) => {
  const total = Object.values(data).reduce((sum, v) => sum + v, 0);
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const colors = [
    "bg-[var(--color-accent-amber)]",
    "bg-[var(--color-opinion-for)]",
    "bg-[var(--color-opinion-against)]",
    "bg-[var(--color-opinion-neutral)]",
    "bg-[var(--color-accent-warm)]",
    "bg-purple-500",
  ];

  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-subtle)]">
        {entries.map(([key, count], i) => (
          <div
            key={key}
            className={cn("transition-all", colors[i % colors.length])}
            style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {entries.map(([key, count], i) => (
          <div key={key} className="flex items-center gap-1">
            <div className={cn("h-1.5 w-1.5 rounded-full", colors[i % colors.length])} />
            <span className="text-[10px] text-muted-foreground">
              {key}: {total > 0 ? ((count / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PopulationPreview = ({ agents, className }: PopulationPreviewProps) => {
  const stats = useMemo(() => {
    const ageCounts: Record<string, number> = {};
    const genderCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    const educationCounts: Record<string, number> = {};

    for (const a of agents) {
      const ageGroup =
        a.age < 26 ? "18-25" : a.age < 36 ? "26-35" : a.age < 51 ? "36-50" : a.age < 66 ? "51-65" : "66+";
      ageCounts[ageGroup] = (ageCounts[ageGroup] ?? 0) + 1;
      genderCounts[a.gender] = (genderCounts[a.gender] ?? 0) + 1;
      locationCounts[a.location_type] = (locationCounts[a.location_type] ?? 0) + 1;
      educationCounts[a.education] = (educationCounts[a.education] ?? 0) + 1;
    }

    return { ageCounts, genderCounts, locationCounts, educationCounts };
  }, [agents]);

  if (agents.length === 0) return null;

  return (
    <div className={cn("rounded-xl border border-border bg-[var(--color-surface)] p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Population Overview
        </span>
        <span className="text-xs font-[family-name:var(--font-data)] text-[var(--color-accent-amber)]">
          {agents.length} agents
        </span>
      </div>

      <MiniBar label="Age" data={stats.ageCounts} />
      <MiniBar label="Gender" data={stats.genderCounts} />
      <MiniBar label="Location" data={stats.locationCounts} />
      <MiniBar label="Education" data={stats.educationCounts} />
    </div>
  );
};

export default PopulationPreview;
export { PopulationPreview };
