"use client";

import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSimulationStore } from "@/stores/simulation";
import { OPINION_MODELS, NETWORK_TOPOLOGIES, SIMULATION_STEPS_MIN, SIMULATION_STEPS_MAX } from "@/lib/constants";

interface SimulationSetupProps {
  onLaunch: () => void;
  disabled?: boolean;
}

const SimulationSetup = ({ onLaunch, disabled }: SimulationSetupProps) => {
  const { config, setConfig, isRunning } = useSimulationStore();

  return (
    <div className="rounded-xl border border-border bg-[var(--color-surface)] p-6 space-y-4">
      <div>
        <label className="text-sm text-muted-foreground mb-1.5 block">Topic / Question</label>
        <Input
          value={config.topic}
          onChange={(e) => setConfig({ topic: e.target.value })}
          placeholder="e.g., Should remote work be mandatory?"
          className="bg-[var(--color-subtle)] border-border"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Steps</label>
          <div className="flex items-center gap-3">
            <Slider
              value={[config.steps]}
              onValueChange={(v) => setConfig({ steps: Array.isArray(v) ? v[0] : v })}
              min={SIMULATION_STEPS_MIN}
              max={SIMULATION_STEPS_MAX}
              step={5}
            />
            <span className="text-sm font-[family-name:var(--font-data)] w-10 text-right">
              {config.steps}
            </span>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Opinion Model</label>
          <Select
            value={config.opinion_model}
            onValueChange={(v) => v && setConfig({ opinion_model: v as "bounded_confidence" | "voter" })}
          >
            <SelectTrigger className="bg-[var(--color-subtle)] border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPINION_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Network</label>
          <Select
            value={config.network_topology}
            onValueChange={(v) => v && setConfig({ network_topology: v as "small_world" | "scale_free" })}
          >
            <SelectTrigger className="bg-[var(--color-subtle)] border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NETWORK_TOPOLOGIES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={onLaunch}
        disabled={isRunning || !config.topic.trim() || disabled}
        className="w-full bg-[var(--color-accent-amber)] text-[var(--color-void)] hover:bg-[var(--color-accent-warm)] font-semibold"
      >
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        {isRunning ? "Running..." : "Launch Simulation"}
      </Button>
    </div>
  );
};

export default SimulationSetup;
export { SimulationSetup };
