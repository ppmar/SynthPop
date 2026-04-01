"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { PopulationBuilder } from "@/components/population/PopulationBuilder";
import { AgentGrid } from "@/components/population/AgentGrid";
import { PopulationPreview } from "@/components/population/PopulationPreview";
import { AgentDetailSheet } from "@/components/population/AgentDetailSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingPopulation } from "@/components/shared/LoadingPopulation";
import { CostTracker } from "@/components/data/CostTracker";
import { usePopulationStore } from "@/stores/population";
import type { Persona } from "@/types/persona";

const PopulationPage = () => {
  const { agents, isGenerating, populationId, costUsd } = usePopulationStore();
  const [selectedAgent, setSelectedAgent] = useState<Persona | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground mb-1">
              Population Builder
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure demographics and generate synthetic personas
            </p>
          </div>
          {costUsd > 0 && <CostTracker costUsd={costUsd} />}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left panel — builder controls */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-20">
              <PopulationBuilder />
            </div>
          </div>

          {/* Right panel — preview + grid */}
          <div className="flex-1 min-w-0 space-y-6">
            {agents.length > 0 && <PopulationPreview agents={agents} />}

            {isGenerating && <LoadingPopulation count={12} />}

            {!isGenerating && agents.length === 0 && (
              <EmptyState
                icon={Users}
                title="No population yet"
                description="Configure demographics on the left and generate a population"
              />
            )}

            {!isGenerating && agents.length > 0 && (
              <AgentGrid agents={agents} />
            )}
          </div>
        </div>

        <AgentDetailSheet
          agent={selectedAgent}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      </div>
    </PageTransition>
  );
};

export default PopulationPage;
