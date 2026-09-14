import { KnowledgeGraph } from "@/components/knowledge-graph/KnowledgeGraph";

export default function GraphPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Knowledge Graph</h1>
      <KnowledgeGraph />
    </section>
  );
}
