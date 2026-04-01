"use client";

import { motion } from "framer-motion";
import { OpinionCard } from "./OpinionCard";
import type { VerbalizedOpinion } from "@/types/api";

interface OpinionStreamProps {
  opinions: VerbalizedOpinion[];
}

const OpinionStream = ({ opinions }: OpinionStreamProps) => {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Individual Opinions ({opinions.length})
      </h2>
      {opinions.map((op, i) => (
        <motion.div
          key={op.persona_id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <OpinionCard opinion={op} />
        </motion.div>
      ))}
    </div>
  );
};

export default OpinionStream;
export { OpinionStream };
