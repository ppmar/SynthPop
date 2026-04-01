"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { opinionColor, opinionLabel } from "@/lib/colors";
import { AnimatedNumber } from "@/components/data/AnimatedNumber";
import type { ClusterSummary as ClusterSummaryType } from "@/types/api";

interface ClusterSummaryProps {
  clusters: ClusterSummaryType[];
  className?: string;
}

const ClusterCard = ({ cluster, index }: { cluster: ClusterSummaryType; index: number }) => {
  const color = opinionColor(cluster.mean_position);
  const label = opinionLabel(cluster.mean_position);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-lg border border-border bg-[var(--color-surface)] p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-foreground">{cluster.label}</span>
        </div>
        <span className="text-xs font-[family-name:var(--font-data)] text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <AnimatedNumber
          value={cluster.percentage}
          suffix="%"
          className="text-xl font-bold text-foreground"
        />
        <span className="text-xs text-muted-foreground">
          ({cluster.agent_count} agents)
        </span>
      </div>

      {cluster.representative_quotes.length > 0 && (
        <div className="space-y-2">
          {cluster.representative_quotes.slice(0, 2).map((q) => (
            <p
              key={q.persona_id}
              className="text-xs text-muted-foreground leading-relaxed border-l-2 pl-3"
              style={{ borderColor: color }}
            >
              &ldquo;{q.text}&rdquo;
              <span className="block mt-0.5 text-[10px] opacity-70">— {q.persona_name}</span>
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const ClusterSummary = ({ clusters, className }: ClusterSummaryProps) => {
  if (clusters.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Opinion Clusters ({clusters.length})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {clusters.map((cluster, i) => (
          <ClusterCard key={cluster.cluster_id} cluster={cluster} index={i} />
        ))}
      </div>
    </div>
  );
};

export default ClusterSummary;
export { ClusterSummary };
