"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AvatarHash } from "./AvatarHash";
import { ConfidenceRing } from "@/components/shared/ConfidenceRing";
import type { Persona } from "@/types/persona";

interface AgentDetailSheetProps {
  agent: Persona | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
        className="h-full rounded-full bg-[var(--color-accent-amber)] transition-all duration-500"
        style={{ width: `${value * 100}%` }}
      />
    </div>
  </div>
);

const AgentDetailSheet = ({ agent, open, onOpenChange }: AgentDetailSheetProps) => {
  if (!agent) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[var(--color-surface)] border-border overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <AvatarHash id={agent.id} name={agent.name} size="lg" />
            <div>
              <SheetTitle className="text-foreground">{agent.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {agent.age} &middot; {agent.gender} &middot; {agent.occupation}
              </p>
              <p className="text-xs text-muted-foreground">
                {agent.location_type} &middot; {agent.country}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Backstory
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{agent.backstory}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Attributes
            </h3>
            <StatBar label="Tech Savviness" value={agent.tech_savviness} />
            <StatBar label="Risk Tolerance" value={agent.risk_tolerance} />
            <StatBar label="Influenceability" value={agent.influenceability} />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Political Leaning
            </h3>
            <div className="h-2 w-full rounded-full opinion-gradient relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-white bg-[var(--color-void)]"
                style={{ left: `${((agent.political_leaning + 1) / 2) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>Left</span>
              <span>{agent.political_leaning.toFixed(2)}</span>
              <span>Right</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Values
            </h3>
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
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Personality
            </h3>
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

          <div className="text-[10px] font-[family-name:var(--font-data)] text-muted-foreground pt-4 border-t border-border">
            ID: {agent.id}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AgentDetailSheet;
export { AgentDetailSheet };
