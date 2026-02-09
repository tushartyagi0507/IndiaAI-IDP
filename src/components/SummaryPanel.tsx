import { useEffect, useState } from "react";
import { Sparkles, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SummaryLength, LanguageMode } from "@/types/document";
import { cn } from "@/lib/utils";
import { useExtractionStore } from "@/store/extractionStore";
import { useToast } from "@/hooks/use-toast";

interface SummaryPanelProps {
  onCitationClick?: (
    pageNumber: number,
    region: { x: number; y: number; width: number; height: number },
  ) => void;
}

const SummaryPanel = (_props: SummaryPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [loading, setloading] = useState(false);

  const { toast } = useToast();

  const currentDocument = useExtractionStore((state) => state.currentDocument);
  const document_id = useExtractionStore((state) => state.document_id);

  // Clear summary when document changes - prevents showing stale data
  useEffect(() => {
    console.log("[SummaryPanel] Document changed:", {
      documentId: document_id,
      documentName: currentDocument?.name,
    });
    console.log("[SummaryPanel] Clearing previous summary");
    setGeneratedSummary(null);
    setIsGenerating(false);
    setloading(false);
  }, [document_id, currentDocument?.name]);

  const handleGenerateSummary = async () => {
    if (!document_id) {
      toast({
        title: "No document selected",
        description: "Please select a document first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setloading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/document/${document_id}/summarize`,
        {
          method: "POST",
        },
      );
      console.log(response);
      setGeneratedSummary((await response.json()).summary);
    } catch (e: unknown) {
      console.error(e);
      toast({
        title: "Error generating summary",
        description:
          "There was a problem generating the summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setloading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Summary
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="hero"
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="ml-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Content */}
      <div className="p-4">
        {!generatedSummary && !isGenerating && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">
              Click "Generate Summary" to create an AI-powered summary
            </p>
            <p className="text-xs mt-1 opacity-70">
              Each summary line will be linked to its source in the document
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="animate-shimmer h-4 rounded bg-muted"
                style={{ width: `${85 - i * 10}%` }}
              />
            ))}
          </div>
        )}

        {generatedSummary && !isGenerating && (
          <div className="prose prose-sm max-w-none">
            <div className="text-sm leading-relaxed space-y-4 max-h-[300px] overflow-y-auto">
              <p>{generatedSummary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;
