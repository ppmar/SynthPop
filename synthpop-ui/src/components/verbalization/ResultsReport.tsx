"use client";

import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DistributionBar } from "@/components/data/DistributionBar";
import { KPICard } from "@/components/data/KPICard";
import { CostTracker } from "@/components/data/CostTracker";
import { ClusterSummary } from "./ClusterSummary";
import { OpinionStream } from "./OpinionStream";
import type { PollResponse } from "@/types/api";

interface ResultsReportProps {
  results: PollResponse;
}

const ResultsReport = ({ results }: ResultsReportProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = [
      `Question: ${results.question}`,
      `Total agents: ${results.total_agents}`,
      `For: ${results.for_pct.toFixed(1)}% | Against: ${results.against_pct.toFixed(1)}% | Neutral: ${results.neutral_pct.toFixed(1)}%`,
      "",
      ...results.opinions.map((o) => `[${o.persona_name}] ${o.text}`),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poll-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <DistributionBar
        forPct={results.for_pct}
        againstPct={results.against_pct}
        neutralPct={results.neutral_pct}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="For" value={results.for_pct} suffix="%" />
        <KPICard label="Against" value={results.against_pct} suffix="%" />
        <KPICard label="Neutral" value={results.neutral_pct} suffix="%" />
        <KPICard label="Confidence" value={results.mean_confidence * 100} suffix="%" />
      </div>

      <ClusterSummary clusters={results.clusters} />
      <OpinionStream opinions={results.opinions} />

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <CostTracker costUsd={results.cost_usd} />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            JSON
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsReport;
export { ResultsReport };
