import { useState } from "react";
import { Languages, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MultiLanguagePanel = () => {
  const [viewMode, setViewMode] = useState<
    "original" | "translated" | "sideBySide"
  >("sideBySide");
  const [hoveredText, setHoveredText] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          Multi-Language View
        </h3>

        <div className="flex items-center rounded-lg border border-border/50 p-1">
          <button
            onClick={() => setViewMode("original")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
              viewMode === "original"
                ? "bg-navy text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Original
          </button>
          <button
            onClick={() => setViewMode("translated")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              viewMode === "translated"
                ? "bg-navy text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            English
          </button>
          <button
            onClick={() => setViewMode("sideBySide")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
              viewMode === "sideBySide"
                ? "bg-navy text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Side by Side
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="py-8 text-center text-sm text-muted-foreground">
          <p>No multilingual content to display yet.</p>
          <p className="text-xs mt-1">
            Connect your translation or language service to populate this panel
            with original and translated text.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiLanguagePanel;
