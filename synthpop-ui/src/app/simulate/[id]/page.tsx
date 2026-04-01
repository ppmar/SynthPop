"use client";

import { use, useState } from "react";
import { ArrowLeft, BarChart3, TrendingUp, Target, Shield } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { KPICard } from "@/components/data/KPICard";
import { DistributionBar } from "@/components/data/DistributionBar";
import { OpinionTimeline } from "@/components/simulation/OpinionTimeline";
import { OpinionDistribution } from "@/components/simulation/OpinionDistribution";
import { PolarizationMeter } from "@/components/simulation/PolarizationMeter";
import { StepSlider } from "@/components/simulation/StepSlider";
import { NetworkGraph } from "@/components/simulation/NetworkGraph";
import { useSimulationResults } from "@/hooks/useSimulation";

interface SimResultsPageProps {
  params: Promise<{ id: string }>;
}

const SimResultsPage = ({ params }: SimResultsPageProps) => {
  const { id } = use(params);
  const { data: results, isLoading, error } = useSimulationResults(id);
  const [viewStep, setViewStep] = useState<number | null>(null);

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/simulate"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Simulation
        </Link>

        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground mb-2">
          Simulation Results
        </h1>
        <p className="text-xs font-[family-name:var(--font-data)] text-muted-foreground mb-8">
          ID: {id}
        </p>

        {isLoading && (
          <div className="text-center py-16 text-muted-foreground">Loading results...</div>
        )}

        {error && (
          <div className="rounded-lg border border-[var(--color-opinion-against)]/30 bg-[var(--color-opinion-against)]/10 p-4 text-sm text-[var(--color-opinion-against)]">
            {error instanceof Error ? error.message : "Failed to load results"}
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Distribution */}
            <DistributionBar
              forPct={results.stats.for_pct}
              againstPct={results.stats.against_pct}
              neutralPct={results.stats.neutral_pct}
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPICard label="Agents" value={results.stats.total_agents} icon={BarChart3} />
              <KPICard label="Final Mean" value={results.stats.final_mean_opinion} decimals={3} icon={TrendingUp} />
              <KPICard label="Polarization" value={results.stats.polarization_index} decimals={3} icon={Target} />
              <KPICard
                label="Convergence"
                value={results.stats.convergence_step ?? results.stats.total_steps}
                suffix=" steps"
                icon={Shield}
              />
            </div>

            {/* Timeline + Polarization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <OpinionTimeline data={results.timeseries} className="lg:col-span-2" />
              <PolarizationMeter value={results.stats.polarization_index} />
            </div>

            {/* Step slider */}
            <StepSlider
              currentStep={viewStep ?? results.stats.total_steps}
              totalSteps={results.stats.total_steps}
              onChange={setViewStep}
            />

            {/* Network + Distribution side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <NetworkGraph opinions={results.final_opinions} />
              <OpinionDistribution opinions={results.final_opinions} />
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default SimResultsPage;
