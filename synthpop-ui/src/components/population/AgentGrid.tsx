"use client";

import { motion } from "framer-motion";
import { AgentCard } from "./AgentCard";
import type { Persona } from "@/types/persona";

interface AgentGridProps {
  agents: Persona[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const AgentGrid = ({ agents }: AgentGridProps) => {
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
