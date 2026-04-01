"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PageTransition } from "@/components/layout/PageTransition";
import { QuestionInput } from "@/components/verbalization/QuestionInput";
import { ResultsReport } from "@/components/verbalization/ResultsReport";
import { api } from "@/lib/api";
import { POPULATION_SIZE_MIN, POPULATION_SIZE_MAX } from "@/lib/constants";
import type { PollResponse } from "@/types/api";

const PollPage = () => {
  const [question, setQuestion] = useState("");
  const [size, setSize] = useState(100);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PollResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePoll = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.poll({ question, population_size: size });
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run poll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground mb-2">
          Quick Poll
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Ask a question to a synthetic population and get instant results
        </p>

        {/* Input */}
        <div className="space-y-4 mb-8">
          <QuestionInput value={question} onChange={setQuestion} disabled={loading} />

          {/* Size slider */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Population:</span>
            <Slider
              value={[size]}
              onValueChange={(v) => setSize(Array.isArray(v) ? v[0] : v)}
              min={POPULATION_SIZE_MIN}
              max={POPULATION_SIZE_MAX}
              step={10}
              className="flex-1"
            />
            <span className="text-sm font-[family-name:var(--font-data)] text-foreground w-12 text-right">
              {size}
            </span>
          </div>

          <Button
            onClick={handlePoll}
            disabled={loading || !question.trim()}
            className="w-full bg-[var(--color-accent-amber)] text-[var(--color-void)] hover:bg-[var(--color-accent-warm)] font-semibold"
          >
            {loading ? (
              <Sparkles className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {loading ? "Polling..." : "Ask"}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-[var(--color-opinion-against)]/30 bg-[var(--color-opinion-against)]/10 p-4 text-sm text-[var(--color-opinion-against)] mb-8">
            {error}
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ResultsReport results={results} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default PollPage;
