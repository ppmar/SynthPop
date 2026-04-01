"use client";

import { use } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { ConfidenceRing } from "@/components/shared/ConfidenceRing";
import { usePopulationStore } from "@/stores/population";
import { hashGradient } from "@/lib/colors";

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

const StatBar = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-[family-name:var(--font-data)] text-foreground">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
    <div className="h-1.5 w-full rounded-full bg-[var(--color-subtle)]">
      <div
        className="h-full rounded-full bg-[var(--color-accent-amber)]"
        style={{ width: `${value * 100}%` }}
      />
    </div>
  </div>
);

const AgentDetailPage = ({ params }: AgentDetailPageProps) => {
  const { id } = use(params);
  const agents = usePopulationStore((s) => s.agents);
  const agent = agents.find((a) => a.id === id);

  if (!agent) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Agent not found</p>
          <Link href="/population" className="text-sm text-[var(--color-accent-amber)] hover:underline">
            Back to Population
          </Link>
        </div>
      </PageTransition>
    );
  }

  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/population"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Population
        </Link>

        <div className="rounded-xl border border-border bg-[var(--color-surface)] p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: hashGradient(agent.id) }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold font-[family-name:var(--font-heading)] text-foreground">
                {agent.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {agent.age} &middot; {agent.gender} &middot; {agent.occupation}
              </p>
              <p className="text-xs text-muted-foreground">
                {agent.location_type} &middot; {agent.country} &middot; {agent.education}
              </p>
            </div>
          </div>

          {/* Backstory */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Backstory
            </h2>
            <p className="text-sm text-foreground leading-relaxed">{agent.backstory}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Attributes
              </h2>
              <StatBar label="Tech Savviness" value={agent.tech_savviness} />
              <StatBar label="Risk Tolerance" value={agent.risk_tolerance} />
              <StatBar label="Influenceability" value={agent.influenceability} />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Political Leaning</span>
                  <span className="text-xs font-[family-name:var(--font-data)] text-foreground">
                    {agent.political_leaning.toFixed(2)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full opinion-gradient relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-white bg-[var(--color-void)]"
                    style={{ left: `${((agent.political_leaning + 1) / 2) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Values & Personality
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {agent.values.map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-[var(--color-accent-amber)]/10 border border-[var(--color-accent-amber)]/20 px-2.5 py-0.5 text-xs text-[var(--color-accent-amber)]"
                  >
                    {v}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {agent.personality_traits.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white/5 border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs font-[family-name:var(--font-data)] text-muted-foreground">
            ID: {agent.id}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AgentDetailPage;
