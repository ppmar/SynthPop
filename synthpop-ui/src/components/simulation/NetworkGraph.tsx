"use client";

import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { cn } from "@/lib/utils";
import type { AgentOpinion } from "@/types/simulation";

interface NetworkGraphProps {
  opinions: AgentOpinion[];
  className?: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  position: number;
  confidence: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

const opinionColorHex = (position: number): string => {
  if (position > 0.15) return "#34D399";
  if (position < -0.15) return "#F87171";
  return "#94A3B8";
};

const NetworkGraph = ({ opinions, className }: NetworkGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes, links } = useMemo(() => {
    const n: GraphNode[] = opinions.map((op, i) => ({
      id: op.persona.id as string ?? `agent-${i}`,
      name: (op.persona.name as string) ?? `Agent ${i}`,
      position: op.opinion.position,
      confidence: op.opinion.confidence,
    }));

    // Create small-world-like links: connect nearby indices + random long-range
    const l: GraphLink[] = [];
    const k = Math.min(4, Math.floor(n.length / 2));
    for (let i = 0; i < n.length; i++) {
      for (let j = 1; j <= k; j++) {
        const target = (i + j) % n.length;
        l.push({ source: n[i].id, target: n[target].id });
      }
    }
    // Add some random long-range connections
    const rng = d3.randomLcg(42);
    const randomInt = d3.randomInt.source(rng)(0, n.length);
    for (let i = 0; i < Math.min(n.length, 20); i++) {
      const a = randomInt();
      const b = randomInt();
      if (a !== b) {
        l.push({ source: n[a].id, target: n[b].id });
      }
    }

    return { nodes: n, links: l };
  }, [opinions]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 350;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(40))
      .force("charge", d3.forceManyBody().strength(-60))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(8));

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "rgba(255,255,255,0.04)")
      .attr("stroke-width", 0.5);

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => 3 + d.confidence * 4)
      .attr("fill", (d) => opinionColorHex(d.position))
      .attr("fill-opacity", 0.8)
      .attr("stroke", (d) => opinionColorHex(d.position))
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.3);

    // Tooltip on hover
    node.append("title").text((d) => `${d.name}\nPosition: ${d.position.toFixed(2)}`);

    // Drag
    const drag = d3.drag<SVGCircleElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node.call(drag as any);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      node
        .attr("cx", (d) => d.x!)
        .attr("cy", (d) => d.y!);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  if (opinions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn("rounded-xl border border-border bg-[var(--color-surface)] p-4 overflow-hidden", className)}
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Social Network
      </h3>
      <svg ref={svgRef} className="w-full" style={{ height: 350 }} />
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#34D399]" /> For
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#94A3B8]" /> Neutral
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#F87171]" /> Against
        </span>
      </div>
    </div>
  );
};

export default NetworkGraph;
export { NetworkGraph };
