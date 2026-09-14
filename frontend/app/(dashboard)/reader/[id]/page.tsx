import { AIPanel } from "@/components/ai-panel/AIPanel";
import { PDFViewer } from "@/components/pdf-viewer/PDFViewer";

export default async function ReaderPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const initialPage = parseInitialPage(resolvedSearchParams?.page);

  return (
    <section className="grid min-h-screen gap-0 lg:grid-cols-[minmax(0,1fr)_auto]">
      <PDFViewer bookId={id} initialPage={initialPage} />
      <AIPanel bookId={id} />
    </section>
  );
}

export function generateStaticParams() {
  return [];
}

function parseInitialPage(value: string | undefined) {
  const parsedValue = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
}
