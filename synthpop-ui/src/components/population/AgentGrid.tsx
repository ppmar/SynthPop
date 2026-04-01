"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AgentCard } from "./AgentCard";
import type { Persona } from "@/types/persona";

interface AgentGridProps {
  agents: Persona[];
}

const VIRTUAL_THRESHOLD = 200;
const COLUMNS = 4;
const ROW_HEIGHT = 180;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const VirtualizedGrid = ({ agents }: { agents: Persona[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(agents.length / COLUMNS);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 3,
  });

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3 font-[family-name:var(--font-data)]">
        {agents.length} agents (virtualized)
      </p>
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto rounded-xl border border-border"
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const startIdx = virtualRow.index * COLUMNS;
            const rowAgents = agents.slice(startIdx, startIdx + COLUMNS);

            return (
              <div
                key={virtualRow.key}
                className="absolute top-0 left-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-1"
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {rowAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AgentGrid = ({ agents }: AgentGridProps) => {
  if (agents.length > VIRTUAL_THRESHOLD) {
    return <VirtualizedGrid agents={agents} />;
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {agents.map((agent) => (
        <motion.div key={agent.id} variants={item}>
          <AgentCard agent={agent} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AgentGrid;
export { AgentGrid };
