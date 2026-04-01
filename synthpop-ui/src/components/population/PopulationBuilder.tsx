"use client";

import { useState } from "react";
import { Plus, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DemographicSlider } from "./DemographicSlider";
import { usePopulationStore, DEFAULT_DEMOGRAPHICS } from "@/stores/population";
import { api } from "@/lib/api";
import { POPULATION_SIZE_MIN, POPULATION_SIZE_MAX, DEMOGRAPHIC_PRESETS } from "@/lib/constants";
import type { DemographicDistributions } from "@/types/persona";

interface PopulationBuilderProps {
  onGenerated?: () => void;
}

const PopulationBuilder = ({ onGenerated }: PopulationBuilderProps) => {
  const {
    size,
    setSize,
    demographics,
    setDemographics,
    setAgents,
    setPopulationId,
    isGenerating,
    setIsGenerating,
  } = usePopulationStore();
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("france_2024");

  const handlePresetChange = (preset: string | null) => {
    if (!preset) return;
    setSelectedPreset(preset);
    const p = DEMOGRAPHIC_PRESETS[preset as keyof typeof DEMOGRAPHIC_PRESETS];
    if (p) {
      setDemographics(p.demographics as DemographicDistributions);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await api.generate({ size, demographics });
      setAgents(res.agents);
      setPopulationId(res.population_id);
      onGenerated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setDemographics(DEFAULT_DEMOGRAPHICS);
    setSelectedPreset("france_2024");
  };

  const updateDemographic = (key: keyof DemographicDistributions, value: Record<string, number>) => {
    setDemographics({ ...demographics, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-40 bg-[var(--color-subtle)] border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DEMOGRAPHIC_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Population size */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Population Size
          </span>
          <span className="text-sm font-[family-name:var(--font-data)] text-[var(--color-accent-amber)]">
            {size}
          </span>
        </div>
        <Slider
          value={[size]}
          onValueChange={(v) => setSize(Array.isArray(v) ? v[0] : v)}
          min={POPULATION_SIZE_MIN}
          max={POPULATION_SIZE_MAX}
          step={10}
        />
      </div>

      {/* Demographic sliders */}
      <DemographicSlider
        label="Age Distribution"
        distribution={demographics.age}
        onChange={(d) => updateDemographic("age", d)}
      />
      <DemographicSlider
        label="Gender"
        distribution={demographics.gender}
        onChange={(d) => updateDemographic("gender", d)}
      />
      <DemographicSlider
        label="Location"
        distribution={demographics.location_type}
        onChange={(d) => updateDemographic("location_type", d)}
      />
      <DemographicSlider
        label="Education"
        distribution={demographics.education}
        onChange={(d) => updateDemographic("education", d)}
      />
      <DemographicSlider
        label="Income"
        distribution={demographics.income_bracket}
        onChange={(d) => updateDemographic("income_bracket", d)}
      />

      {error && (
        <div className="rounded-lg border border-[var(--color-opinion-against)]/30 bg-[var(--color-opinion-against)]/10 p-3 text-sm text-[var(--color-opinion-against)]">
          {error}
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-[var(--color-accent-amber)] text-[var(--color-void)] hover:bg-[var(--color-accent-warm)] font-semibold"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        {isGenerating ? "Generating..." : "Generate Population"}
      </Button>
    </div>
  );
};

export default PopulationBuilder;
export { PopulationBuilder };
