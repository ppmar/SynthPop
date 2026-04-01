"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Users, Zap, Activity, Clock, Coins } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { KPICard } from "@/components/data/KPICard";
import { usePopulationStore } from "@/stores/population";
import { useSimulationStore } from "@/stores/simulation";
import { useUIStore } from "@/stores/ui";

const quickActions = [
  {
    href: "/poll",
    icon: MessageSquare,
    title: "Quick Poll",
    description: "Ask N agents a question, get instant results",
    color: "var(--color-opinion-for)",
  },
  {
    href: "/population",
    icon: Users,
    title: "Build Population",
    description: "Create a custom demographic population",
    color: "var(--color-accent-amber)",
  },
  {
    href: "/simulate",
    icon: Zap,
    title: "Run Simulation",
    description: "Full ABM simulation with opinion dynamics",
    color: "var(--color-opinion-against)",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const TypewriterText = ({ texts }: { texts: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const text = texts[currentIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (displayed.length < text.length) {
            setDisplayed(text.slice(0, displayed.length + 1));
          } else {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          if (displayed.length > 0) {
            setDisplayed(text.slice(0, displayed.length - 1));
          } else {
            setIsDeleting(false);
            setCurrentIndex((i) => (i + 1) % texts.length);
          }
        }
      },
      isDeleting ? 30 : 60
    );
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, currentIndex, texts]);

  return (
    <span className="font-[family-name:var(--font-data)] text-[var(--color-accent-amber)]">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
};

const DashboardPage = () => {
  const agentCount = usePopulationStore((s) => s.agents.length);
  const populationId = usePopulationStore((s) => s.populationId);
  const simulationId = useSimulationStore((s) => s.simulationId);
  const totalCost = useUIStore((s) => s.totalCostUsd);
  const popCost = usePopulationStore((s) => s.costUsd);
  const simCost = useSimulationStore((s) => s.costUsd);

  const typewriterTexts = [
    "Simulate 1,000 opinions in seconds",
    "What would people think about AI?",
    "Generate diverse synthetic populations",
    "Run opinion dynamics simulations",
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold text-foreground mb-4"
          >
            SynthPop
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto font-[family-name:var(--font-heading)] h-7"
          >
            <TypewriterText texts={typewriterTexts} />
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        >
          {quickActions.map((action) => (
            <motion.div key={action.href} variants={item}>
              <Link
                href={action.href}
                className="group block rounded-xl border border-border bg-[var(--color-surface)] p-6 transition-all hover:bg-[var(--color-elevated)] hover:border-[var(--color-accent-amber)]/30 hover:glow-amber-sm"
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in srgb, ${action.color} 15%, transparent)` }}
                >
                  <action.icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <h3 className="text-base font-semibold font-[family-name:var(--font-heading)] text-foreground mb-1 group-hover:text-[var(--color-accent-amber)] transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Session Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPICard label="Agents Created" value={agentCount} icon={Users} />
            <KPICard
              label="Populations"
              value={populationId ? 1 : 0}
              icon={Activity}
            />
            <KPICard
              label="Simulations"
              value={simulationId ? 1 : 0}
              icon={Clock}
            />
            <KPICard
              label="Total Cost"
              value={totalCost + popCost + simCost}
              prefix="$"
              decimals={4}
              icon={Coins}
            />
          </div>
        </motion.div>

        {/* Getting started hint */}
        {agentCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-muted-foreground mb-2">
              Get started by building a population or running a quick poll
            </p>
            <p className="text-xs text-muted-foreground/60 font-[family-name:var(--font-data)]">
              Start the Python backend with: <code className="bg-[var(--color-subtle)] px-1.5 py-0.5 rounded">synthpop serve</code>
            </p>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default DashboardPage;
