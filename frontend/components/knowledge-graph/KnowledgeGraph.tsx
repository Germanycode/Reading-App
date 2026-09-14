"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeDragHandler,
  type NodeMouseHandler
} from "reactflow";
import "reactflow/dist/style.css";
import { getKnowledgeGraph, updateGraphNodePosition } from "@/lib/api";
import type { GraphNode } from "@/lib/types";

export function KnowledgeGraph() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const graphQuery = useQuery({
    queryKey: ["knowledge-graph"],
    queryFn: getKnowledgeGraph
  });
  const positionMutation = useMutation({
    mutationFn: ({ nodeId, x, y }: { nodeId: string; x: number; y: number }) => updateGraphNodePosition(nodeId, x, y)
  });
  const nodes = useMemo<Node[]>(
    () =>
      (graphQuery.data?.nodes ?? []).map((node, index) => ({
        id: node.id,
        position: {
          x: node.x_pos ?? (index % 6) * 220,
          y: node.y_pos ?? Math.floor(index / 6) * 140
        },
        data: {
          label: node.book_id ? node.label : `${node.label} - cross-book`
        },
        className: node.book_id ? "border-primary/70 bg-muted text-foreground" : "border-emerald-500/70 bg-emerald-950 text-emerald-50"
      })),
    [graphQuery.data?.nodes]
  );
  const edges = useMemo<Edge[]>(
    () =>
      (graphQuery.data?.edges ?? []).map((edge) => ({
        id: edge.id,
        source: edge.source_id,
        target: edge.target_id,
        label: edge.relation ?? "related to",
        animated: false,
        style: { stroke: "hsl(var(--primary))" },
        labelStyle: { fill: "hsl(var(--foreground))", fontSize: 12 }
      })),
    [graphQuery.data?.edges]
  );
  const selectedNode = useMemo(
    () => (graphQuery.data?.nodes ?? []).find((node) => node.id === selectedNodeId) ?? null,
    [graphQuery.data?.nodes, selectedNodeId]
  );
  const handleNodeDragStop: NodeDragHandler = (_event, node) => {
    positionMutation.mutate({ nodeId: node.id, x: node.position.x, y: node.position.y });
  };
  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    setSelectedNodeId(node.id);
  };

  if (graphQuery.isLoading) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-md border border-border bg-muted/40 p-8 text-sm text-muted-foreground">
        Loading knowledge graph...
      </div>
    );
  }

  if (graphQuery.isError) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-md border border-red-900/60 bg-red-950/40 p-8 text-sm text-red-200">
        Unable to load the knowledge graph.
      </div>
    );
  }

  if (!nodes.length) {
    return (
      <div className="flex min-h-[560px] items-center justify-center rounded-md border border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        Save a note in the reader, then use its Graph action to extract concepts.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="h-[calc(100vh-9rem)] min-h-[560px] overflow-hidden rounded-md border border-border bg-background">
        <ReactFlow nodes={nodes} edges={edges} fitView onNodeClick={handleNodeClick} onNodeDragStop={handleNodeDragStop}>
          <Background color="hsl(var(--border))" gap={24} />
          <Controls />
        </ReactFlow>
      </div>
      <GraphSourcePanel node={selectedNode} />
    </div>
  );
}

function GraphSourcePanel({ node }: { node: GraphNode | null }) {
  if (!node) {
    return (
      <aside className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Select a graph node to see its source note and page.
      </aside>
    );
  }

  const hasSource = Boolean(node.book_id || node.note_id || node.note_content || node.note_highlight);
  const readerHref = node.book_id
    ? `/reader/${node.book_id}${node.page_number ? `?page=${node.page_number}` : ""}`
    : null;

  return (
    <aside className="rounded-md border border-border bg-muted/40 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected concept</p>
      <h2 className="mt-2 text-lg font-semibold">{node.label}</h2>
      {hasSource ? (
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-md border border-border bg-background/70 p-3">
            <p className="text-xs text-muted-foreground">Book</p>
            <p className="mt-1 font-medium">{node.book_title ?? node.book_id ?? "Unknown book"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{node.page_number ? `Page ${node.page_number}` : "Page source unavailable"}</p>
          </div>
          {node.note_highlight ? (
            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
              <p className="text-xs text-yellow-100/80">Highlight</p>
              <p className="mt-2 line-clamp-6 text-sm text-yellow-50">{node.note_highlight}</p>
            </div>
          ) : null}
          {node.note_content ? (
            <div className="rounded-md border border-border bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Note</p>
              <p className="mt-2 line-clamp-8 whitespace-pre-wrap text-sm">{node.note_content}</p>
            </div>
          ) : null}
          {readerHref ? (
            <Link className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90" href={readerHref}>
              Open source page
            </Link>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-border bg-background/70 p-3 text-sm text-muted-foreground">
          This node is not linked to a source note yet. Create it from a reader note using the Graph action.
        </p>
      )}
    </aside>
  );
}
