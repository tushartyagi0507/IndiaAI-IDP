import { useState } from "react";
import { 
  Sparkles, 
  Loader2, 
  Globe, 
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SummaryLength, LanguageMode } from "@/types/document";
import { cn } from "@/lib/utils";

interface SummaryPanelProps {
  onCitationClick?: (pageNumber: number, region: { x: number; y: number; width: number; height: number }) => void;
}

const SummaryPanel = ({ onCitationClick }: SummaryPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('short');
  const [language, setLanguage] = useState<LanguageMode>('english');
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);

  const citations = [
    { id: '1', text: 'India has emerged as a global leader in AI innovation', page: 1, region: { x: 10, y: 20, width: 70, height: 5 } },
    { id: '2', text: 'Budget Allocation: ₹10,000 Crores', page: 2, region: { x: 10, y: 45, width: 40, height: 4 } },
    { id: '3', text: 'Expected Impact: 500,000 new jobs', page: 2, region: { x: 10, y: 50, width: 35, height: 4 } },
    { id: '4', text: 'Target Completion: December 2025', page: 3, region: { x: 10, y: 55, width: 30, height: 4 } },
  ];

  const shortSummary = `This document outlines India's National AI Strategy, positioning the country as a global AI powerhouse by 2025. Key highlights include a ₹10,000 Crores budget allocation [2], expected creation of 500,000 jobs [3], and focus areas spanning healthcare, agriculture, smart cities, and financial services [1]. The target completion is December 2025 [4].`;

  const detailedSummary = `The India AI Development Report presents a comprehensive strategy for establishing India as a global leader in artificial intelligence [1]. The initiative, led by the Ministry of Electronics & IT, outlines ambitious goals and substantial investments.

**Financial Commitment:**
The government has allocated ₹10,000 Crores for AI development [2], marking one of the largest investments in emerging technologies in the country's history.

**Economic Impact:**
The strategy is expected to generate 500,000 new jobs across various sectors [3], significantly contributing to India's digital economy growth.

**Focus Areas:**
1. Healthcare AI Solutions - Improving diagnostics and patient care
2. Agricultural Technology - Smart farming and crop optimization
3. Smart City Infrastructure - Urban planning and traffic management
4. Financial Services Automation - Enhanced banking and fintech solutions

**Timeline:**
All major initiatives are targeted for completion by December 2025 [4], with phased implementation beginning immediately.`;

  const handleGenerateSummary = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedSummary(summaryLength === 'short' ? shortSummary : detailedSummary);
      setIsGenerating(false);
    }, 2000);
  };

  const renderSummaryWithCitations = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const citationMatch = part.match(/\[(\d+)\]/);
      if (citationMatch) {
        const citationId = citationMatch[1];
        const citation = citations.find(c => c.id === citationId);
        return (
          <button
            key={index}
            onClick={() => citation && onCitationClick?.(citation.page, citation.region)}
            className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors mx-0.5"
          >
            {citationId}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
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
              onClick={() => setSummaryLength('short')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                summaryLength === 'short'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Short
            </button>
            <button
              onClick={() => setSummaryLength('detailed')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                summaryLength === 'detailed'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Detailed
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center rounded-lg border border-border/50 p-1">
            <button
              onClick={() => setLanguage('original')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
                language === 'original'
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              Original
            </button>
            <button
              onClick={() => setLanguage('english')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                language === 'english'
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
            <p className="text-sm">Click "Generate Summary" to create an AI-powered summary</p>
            <p className="text-xs mt-1 opacity-70">Each summary line will be linked to its source in the document</p>
          </div>
        )}

        {isGenerating && (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="animate-shimmer h-4 rounded bg-muted" style={{ width: `${85 - i * 10}%` }} />
            ))}
          </div>
        )}

        {generatedSummary && !isGenerating && (
          <div className="prose prose-sm max-w-none">
            <div className="text-sm leading-relaxed space-y-4">
              {generatedSummary.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className={cn(
                  paragraph.startsWith('**') && "font-semibold text-foreground"
                )}>
                  {renderSummaryWithCitations(paragraph.replace(/\*\*/g, ''))}
                </p>
              ))}
            </div>
            
            {/* Citations Legend */}
            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-3">Sources</p>
              <div className="space-y-2">
                {citations.map((citation) => (
                  <button
                    key={citation.id}
                    onClick={() => onCitationClick?.(citation.page, citation.region)}
                    className="flex items-start gap-2 text-left w-full p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-medium rounded bg-primary/10 text-primary shrink-0">
                      {citation.id}
                    </span>
                    <span className="text-xs text-muted-foreground flex-1">{citation.text}</span>
                    <span className="text-xs text-muted-foreground/50 group-hover:text-primary transition-colors flex items-center gap-1">
                      Page {citation.page}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;
