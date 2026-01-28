import { useState } from "react";
import { Sparkles, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SummaryLength, LanguageMode } from "@/types/document";
import { cn } from "@/lib/utils";

interface SummaryPanelProps {
  onCitationClick?: (
    pageNumber: number,
    region: { x: number; y: number; width: number; height: number },
  ) => void;
}

const SummaryPanel = ({ onCitationClick }: SummaryPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>("short");
  const [language, setLanguage] = useState<LanguageMode>("english");
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);

  const placeholderSummary =
    "Summary generation is not yet connected. Once your AI or backend service is integrated, generated summaries will appear here.";

  const handleGenerateSummary = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // For now we only show a neutral placeholder to avoid shipping sample content.
      setGeneratedSummary(placeholderSummary);
      setIsGenerating(false);
    }, 2000);
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
          {/* Length Selector */}
          <div className="flex items-center rounded-lg border border-border/50 p-1">
            <button
              onClick={() => setSummaryLength("short")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                summaryLength === "short"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Short
            </button>
            <button
              onClick={() => setSummaryLength("detailed")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                summaryLength === "detailed"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Detailed
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center rounded-lg border border-border/50 p-1">
            <button
              onClick={() => setLanguage("original")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
                language === "original"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              Original
            </button>
            <button
              onClick={() => setLanguage("english")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                language === "english"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              English
            </button>
          </div>

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
            <div className="text-sm leading-relaxed space-y-4">
              <p>{generatedSummary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;
