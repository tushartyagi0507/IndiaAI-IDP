import { useState } from "react";
import { Globe, Languages, ArrowLeftRight, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageMode } from "@/types/document";
import { cn } from "@/lib/utils";

const MultiLanguagePanel = () => {
  const [viewMode, setViewMode] = useState<'original' | 'translated' | 'sideBySide'>('sideBySide');
  const [hoveredText, setHoveredText] = useState<string | null>(null);

  const originalText = [
    { id: '1', text: 'भारत में आर्टिफिशियल इंटेलिजेंस का विकास', translation: 'Development of Artificial Intelligence in India' },
    { id: '2', text: 'सरकार ने AI विकास के लिए ₹10,000 करोड़ आवंटित किए हैं।', translation: 'The government has allocated ₹10,000 crores for AI development.' },
    { id: '3', text: 'यह पहल 5 लाख नई नौकरियां पैदा करने का लक्ष्य रखती है।', translation: 'This initiative aims to create 500,000 new jobs.' },
    { id: '4', text: 'स्वास्थ्य सेवा, कृषि और स्मार्ट शहर प्राथमिकता वाले क्षेत्र हैं।', translation: 'Healthcare, agriculture, and smart cities are priority sectors.' },
    { id: '5', text: 'लक्षित पूर्णता तिथि दिसंबर 2025 है।', translation: 'The target completion date is December 2025.' },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          Multi-Language View
        </h3>
        
        <div className="flex items-center rounded-lg border border-border/50 p-1">
          <button
            onClick={() => setViewMode('original')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
              viewMode === 'original'
                ? "bg-navy text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Original
          </button>
          <button
            onClick={() => setViewMode('translated')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              viewMode === 'translated'
                ? "bg-navy text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            English
          </button>
          <button
            onClick={() => setViewMode('sideBySide')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
              viewMode === 'sideBySide'
                ? "bg-navy text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Side by Side
          </button>
        </div>
      </div>

      <div className="p-4">
        {viewMode === 'sideBySide' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Hindi (Original)</span>
              </div>
              <div className="space-y-3">
                {originalText.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                      hoveredText === item.id
                        ? "border-primary bg-primary/5"
                        : "border-border/30 hover:border-primary/30"
                    )}
                    onMouseEnter={() => setHoveredText(item.id)}
                    onMouseLeave={() => setHoveredText(null)}
                  >
                    <p className="text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-emerald" />
                <span className="text-sm font-medium">English (Translated)</span>
              </div>
              <div className="space-y-3">
                {originalText.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-200",
                      hoveredText === item.id
                        ? "border-emerald bg-emerald/5"
                        : "border-border/30"
                    )}
                  >
                    <p className="text-sm">{item.translation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {originalText.map((item) => (
              <div
                key={item.id}
                className="group relative p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-all"
              >
                <p className="text-sm">
                  {viewMode === 'original' ? item.text : item.translation}
                </p>
                
                {/* Hover Translation Tooltip */}
                {viewMode === 'original' && (
                  <div className="absolute left-0 right-0 top-full mt-1 p-3 rounded-lg bg-secondary text-secondary-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xl pointer-events-none">
                    <div className="flex items-center gap-2 mb-1 text-accent">
                      <Globe className="w-3 h-3" />
                      <span className="font-medium">English Translation</span>
                    </div>
                    {item.translation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            Hover over text to see instant translations
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiLanguagePanel;
