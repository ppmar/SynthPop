"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingPopulationProps {
  count?: number;
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

const LoadingPopulation = ({ count = 8 }: LoadingPopulationProps) => {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          variants={item}
          className="rounded-xl border border-border bg-[var(--color-surface)] p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-3 w-full mb-1.5" />
          <Skeleton className="h-3 w-3/4" />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default LoadingPopulation;
export { LoadingPopulation };
