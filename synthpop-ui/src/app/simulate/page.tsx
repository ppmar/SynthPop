"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";
import { SimulationSetup } from "@/components/simulation/SimulationSetup";
import { SimulationLive } from "@/components/simulation/SimulationLive";
import { EmptyState } from "@/components/shared/EmptyState";
import { useSimulationStore } from "@/stores/simulation";
import { usePopulationStore } from "@/stores/population";
import { useStartSimulation, useSimulationStatus } from "@/hooks/useSimulation";

const SimulatePage = () => {
  const { config, simulationId, setSimulationId, isRunning, setIsRunning } =
    useSimulationStore();
  const { populationId, agents } = usePopulationStore();
  const startMutation = useStartSimulation();
  const [error, setError] = useState<string | null>(null);

  const { data: status } = useSimulationStatus(simulationId, isRunning);

  const handleStart = async () => {
    if (!populationId || !config.topic.trim()) return;
    setError(null);
    setIsRunning(true);
    try {
      const res = await startMutation.mutateAsync({
        population_id: populationId,
        topic: config.topic,
        steps: config.steps,
        opinion_model: config.opinion_model,
        network_topology: config.network_topology,
      });
      setSimulationId(res.simulation_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start simulation");
      setIsRunning(false);
    }
  };

  if (status?.status === "completed" && isRunning) {
    setIsRunning(false);
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground mb-2">
          Simulation
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Run opinion dynamics on your population
        </p>

        {!populationId && (
          <EmptyState
            icon={Users}
            title="No population loaded"
            description="Generate a population first in the Population Builder"
            action={
              <a
                href="/population"
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-accent-amber)] text-[var(--color-void)] hover:bg-[var(--color-accent-warm)] px-4 py-2 text-sm font-medium transition-colors"
              >
                Build Population
              </a>
            }
          />
        )}

        {populationId && (
          <div className="space-y-6">
            <SimulationSetup onLaunch={handleStart} disabled={isRunning} />

            {error && (
              <div className="rounded-lg border border-[var(--color-opinion-against)]/30 bg-[var(--color-opinion-against)]/10 p-4 text-sm text-[var(--color-opinion-against)]">
                {error}
              </div>
            )}

            <AnimatePresence>
              {status && <SimulationLive status={status} />}
            </AnimatePresence>

            <p className="text-xs text-center text-muted-foreground">
              {agents.length} agents loaded &middot; Population {populationId?.slice(0, 8)}
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default SimulatePage;
