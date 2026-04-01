"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { KPICard } from "@/components/data/KPICard";
import { OpinionTimeline } from "./OpinionTimeline";
import { PolarizationMeter } from "./PolarizationMeter";
import { TrendingUp, Target, Shield } from "lucide-react";
import type { SimulationStatus } from "@/types/simulation";

interface SimulationLiveProps {
  status: SimulationStatus;
}

const SimulationLive = ({ status }: SimulationLiveProps) => {
  const progress = (status.current_step / status.total_steps) * 100;
  const latest = status.snapshots[status.snapshots.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Progress bar */}
      <div className="rounded-xl border border-border bg-[var(--color-surface)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Step {status.current_step} / {status.total_steps}
          </span>
          <span className="text-xs font-[family-name:var(--font-data)] text-[var(--color-accent-amber)]">
            {status.status}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* KPIs */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <KPICard
            label="Mean Opinion"
            value={latest.mean_opinion}
            decimals={3}
            icon={TrendingUp}
          />
          <KPICard
            label="Variance"
            value={latest.opinion_variance}
            decimals={4}
            icon={Target}
          />
          <KPICard
            label="Confidence"
            value={latest.mean_confidence * 100}
            suffix="%"
            decimals={1}
            icon={Shield}
          />
        </div>
      )}

      {/* Timeline + polarization */}
      {status.snapshots.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <OpinionTimeline data={status.snapshots} className="lg:col-span-2" />
          {latest && (
            <PolarizationMeter
              value={Math.min(1, latest.opinion_variance * 4)}
            />
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SimulationLive;
export { SimulationLive };
