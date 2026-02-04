import { useEffect, useMemo, useState } from "react";
import { Languages, ArrowLeftRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExtractionStore } from "@/store/extractionStore";
import { useToast } from "@/hooks/use-toast";

const MultiLanguagePanel = () => {
  const [viewMode, setViewMode] = useState<
    "original" | "translated" | "sideBySide"
  >("sideBySide");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const documentsByFilename = useExtractionStore(
    (state) => state.documentsByFilename,
  );
  const currentDocument = useExtractionStore((state) => state.currentDocument);
  const document_id = useExtractionStore((state) => state.document_id);
  const { toast } = useToast();

  const originalText = useMemo(() => {
    if (!currentDocument) return "";
    const doc = documentsByFilename[currentDocument.name];
    return doc?.markdown || doc?.html || "";
  }, [currentDocument, documentsByFilename]);

  useEffect(() => {
    setTranslatedText(null);
    setTranslateError(null);
    setIsTranslating(false);
  }, [document_id]);

  const fetchTranslation = async () => {
    if (!document_id) {
      toast({
        title: "No document selected",
        description: "Please select a document first.",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    setTranslateError(null);
    try {
      const response = await fetch(
        `http://localhost:8003/document/${document_id}/translate`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to translate document: ${response.statusText}`);
      }

      const payload = (await response.json()) as {
        translation?: string;
        translated_text?: string;
        translated?: string;
        text?: string;
      };
      const translated =
        payload.translation ??
        payload.translated_text ??
        payload.translated ??
        payload.text ??
        "";
      setTranslatedText(translated || null);
    } catch (error) {
      console.error("Translation error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to translate document.";
      setTranslateError(message);
      toast({
        title: "Translation failed",
        description: message,
        variant: "destructive",
      });
      setTranslatedText(null);
    } finally {
      setIsTranslating(false);
    }
  };

  const renderContent = (text: string | null, isLoading?: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Translating...
        </div>
      );
    }

    if (!text) {
      return (
        <p className="text-sm text-muted-foreground text-center py-6">
          No content available yet.
        </p>
      );
    }

    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {text}
      </div>
    );
  };

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
            onClick={() => {
              setViewMode("translated");
              if (!translatedText && !isTranslating) {
                void fetchTranslation();
              }
            }}
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
            onClick={() => {
              setViewMode("sideBySide");
              if (!translatedText && !isTranslating) {
                void fetchTranslation();
              }
            }}
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
        {viewMode === "original" && (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            {renderContent(originalText)}
          </div>
        )}

        {viewMode === "translated" && (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            {translateError ? (
              <p className="text-sm text-destructive text-center py-6">
                {translateError}
              </p>
            ) : (
              renderContent(translatedText, isTranslating)
            )}
          </div>
        )}

        {viewMode === "sideBySide" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Original
              </p>
              {renderContent(originalText)}
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                English
              </p>
              {translateError ? (
                <p className="text-sm text-destructive text-center py-6">
                  {translateError}
                </p>
              ) : (
                renderContent(translatedText, isTranslating)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiLanguagePanel;
