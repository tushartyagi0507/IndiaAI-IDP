// import { useEffect, useMemo, useState } from "react";
// import { Languages, ArrowLeftRight, Loader2 } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { useExtractionStore } from "@/store/extractionStore";
// import { useToast } from "@/hooks/use-toast";

// const MultiLanguagePanel = () => {
//   const [viewMode, setViewMode] = useState<
//     "original" | "translated" | "sideBySide"
//   >("sideBySide");
//   const [translatedText, setTranslatedText] = useState<string | null>(null);
//   const [isTranslating, setIsTranslating] = useState(false);
//   const [translateError, setTranslateError] = useState<string | null>(null);

//   const documentsByFilename = useExtractionStore(
//     (state) => state.documentsByFilename,
//   );
//   const currentDocument = useExtractionStore((state) => state.currentDocument);
//   const document_id = useExtractionStore((state) => state.document_id);
//   const { toast } = useToast();

//   const originalText = useMemo(() => {
//     if (!currentDocument) return "";
//     const doc = documentsByFilename[currentDocument.name];
//     return doc?.markdown || doc?.html || "";
//   }, [currentDocument, documentsByFilename]);

//   useEffect(() => {
//     setTranslatedText(null);
//     setTranslateError(null);
//     setIsTranslating(false);
//   }, [document_id]);

//   const fetchTranslation = async () => {
//     if (!document_id) {
//       toast({
//         title: "No document selected",
//         description: "Please select a document first.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsTranslating(true);
//     setTranslateError(null);
//     try {
//       const response = await fetch(
//         `http://localhost:8080/document/${document_id}/translate`,
//         {
//           method: "POST",
//         },
//       );

//       if (!response.ok) {
//         throw new Error(`Failed to translate document: ${response.statusText}`);
//       }

//       const payload = (await response.json()) as {
//         translation?: string;
//         translated_text?: string;
//         translated?: string;
//         text?: string;
//       };
//       const translated =
//         payload.translation ??
//         payload.translated_text ??
//         payload.translated ??
//         payload.text ??
//         "";
//       setTranslatedText(translated || null);
//     } catch (error) {
//       console.error("Translation error:", error);
//       const message =
//         error instanceof Error
//           ? error.message
//           : "Failed to translate document.";
//       setTranslateError(message);
//       toast({
//         title: "Translation failed",
//         description: message,
//         variant: "destructive",
//       });
//       setTranslatedText(null);
//     } finally {
//       setIsTranslating(false);
//     }
//   };

//   const renderContent = (text: string | null, isLoading?: boolean) => {
//     if (isLoading) {
//       return (
//         <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
//           <Loader2 className="w-4 h-4 animate-spin mr-2" />
//           Translating...
//         </div>
//       );
//     }

//     if (!text) {
//       return (
//         <p className="text-sm text-muted-foreground text-center py-6">
//           No content available yet.
//         </p>
//       );
//     }

//     return (
//       <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
//         {text}
//       </div>
//     );
//   };

//   return (
//     <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
//       <div className="flex items-center justify-between p-4 border-b border-border/50">
//         <h3 className="font-display font-semibold flex items-center gap-2">
//           <Languages className="w-4 h-4 text-primary" />
//           Multi-Language View
//         </h3>

//         <div className="flex items-center rounded-lg border border-border/50 p-1">
//           <button
//             onClick={() => setViewMode("original")}
//             className={cn(
//               "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
//               viewMode === "original"
//                 ? "bg-navy text-secondary-foreground"
//                 : "text-muted-foreground hover:text-foreground",
//             )}
//           >
//             Original
//           </button>
//           <button
//             onClick={() => {
//               setViewMode("translated");
//               if (!translatedText && !isTranslating) {
//                 void fetchTranslation();
//               }
//             }}
//             className={cn(
//               "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
//               viewMode === "translated"
//                 ? "bg-navy text-secondary-foreground"
//                 : "text-muted-foreground hover:text-foreground",
//             )}
//           >
//             English
//           </button>
//           <button
//             onClick={() => {
//               setViewMode("sideBySide");
//               if (!translatedText && !isTranslating) {
//                 void fetchTranslation();
//               }
//             }}
//             className={cn(
//               "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
//               viewMode === "sideBySide"
//                 ? "bg-navy text-secondary-foreground"
//                 : "text-muted-foreground hover:text-foreground",
//             )}
//           >
//             <ArrowLeftRight className="w-3.5 h-3.5" />
//             Side by Side
//           </button>
//         </div>
//       </div>

//       <div className="p-4">
//         {viewMode === "original" && (
//           <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
//             {renderContent(originalText)}
//           </div>
//         )}

//         {viewMode === "translated" && (
//           <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
//             {translateError ? (
//               <p className="text-sm text-destructive text-center py-6">
//                 {translateError}
//               </p>
//             ) : (
//               renderContent(translatedText, isTranslating)
//             )}
//           </div>
//         )}

//         {viewMode === "sideBySide" && (
//           <div className="grid gap-4 md:grid-cols-2">
//             <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
//               <p className="text-xs font-medium text-muted-foreground mb-2">
//                 Original
//               </p>
//               {renderContent(originalText)}
//             </div>
//             <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
//               <p className="text-xs font-medium text-muted-foreground mb-2">
//                 English
//               </p>
//               {translateError ? (
//                 <p className="text-sm text-destructive text-center py-6">
//                   {translateError}
//                 </p>
//               ) : (
//                 renderContent(translatedText, isTranslating)
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MultiLanguagePanel;

import { useEffect, useMemo, useRef, useState } from "react";
import { Languages, ArrowLeftRight, Loader2, Download } from "lucide-react";

import { cn } from "@/lib/utils";
import { useExtractionStore } from "@/store/extractionStore";
import { useToast } from "@/hooks/use-toast";

/**
 * Normalise spaced-out HTML tags that translation APIs often produce.
 * e.g. "< br / >" → "<br/>", "< / td >" → "</td>", "< td >" → "<td>"
 */
const normalizeHTMLTags = (text: string): string =>
  text
    .replace(/<\s+/g, "<")
    .replace(/\s+>/g, ">")
    .replace(/<\/\s+/g, "</")
    .replace(/\s+\/>/g, "/>");

/** Strip image tags (HTML & markdown) and replace with plain alt text */
const stripImages = (text: string): string =>
  text
    .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, (_m, alt: string) =>
      alt ? `Image: ${alt}` : "",
    )
    .replace(/<img[^>]*\/?>/gi, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, (_m, alt: string) =>
      alt ? `Image: ${alt}` : "",
    );

/**
 * Convert basic markdown syntax to HTML so the content can always be
 * rendered via dangerouslySetInnerHTML. Existing HTML tags pass through
 * untouched; only markdown-specific syntax is converted.
 */
const markdownToHtml = (md: string): string => {
  let html = md;

  // Headings (run largest → smallest so ## doesn't match before ###)
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Horizontal rules
  html = html.replace(/^[-*_]{3,}\s*$/gm, "<hr/>");

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic (*text*) – only between non-word chars to avoid breaking URLs
  html = html.replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, "<em>$1</em>");

  // Two trailing spaces + newline → <br/> (markdown explicit line break)
  html = html.replace(/ {2,}\n/g, "<br/>");

  // Double newline → visible paragraph break
  html = html.replace(/\n{2,}/g, "<br/><br/>");

  // Remaining single newlines → <br/>
  html = html.replace(/\n/g, "<br/>");

  return html;
};

/** Preprocessing pipeline for original (HTML) content */
const preprocessContent = (text: string): string =>
  stripImages(normalizeHTMLTags(text));

/** Preprocessing pipeline for translated content (markdown + HTML mix) */
const preprocessTranslated = (text: string): string =>
  markdownToHtml(preprocessContent(text));

const MultiLanguagePanel = () => {
  const [viewMode, setViewMode] = useState<
    "original" | "translated" | "sideBySide"
  >("original");

  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const translatedRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const documentsByFilename = useExtractionStore(
    (state) => state.documentsByFilename,
  );
  const currentDocument = useExtractionStore((state) => state.currentDocument);
  const document_id = useExtractionStore((state) => state.document_id);
  const { toast } = useToast();

  const originalText = useMemo(() => {
    if (!currentDocument) return "";
    const doc = documentsByFilename[currentDocument.name];

    // Process layout blocks for better formatting (same as ExtractedDataPanel)
    const firstPage = doc?.pages?.[0];
    if (
      firstPage &&
      typeof firstPage === "object" &&
      "layout_blocks" in firstPage
    ) {
      const layoutBlocks = (firstPage as Record<string, unknown>)
        .layout_blocks as Array<{
        bbox: [number, number, number, number];
        label: string;
        content: string;
      }>;

      // Sort blocks by vertical position (top to bottom), then left to right
      const sortedBlocks = layoutBlocks.sort((a, b) => {
        const [, aY] = a.bbox;
        const [, bY] = b.bbox;
        if (Math.abs(aY - bY) < 50) {
          return a.bbox[0] - b.bbox[0];
        }
        return aY - bY;
      });

      // Filter out image blocks and empty content
      const filteredBlocks = sortedBlocks.filter(
        (block) =>
          block.label !== "Image" &&
          block.content &&
          block.content.trim() &&
          !block.content.includes("img alt=") &&
          !block.content.includes("<img"),
      );

      // Create cleaned HTML content
      const cleanHtml = filteredBlocks
        .map((block) => block.content)
        .join("\n\n");
      return cleanHtml || doc?.markdown || doc?.html || "";
    }

    return doc?.markdown || doc?.html || "";
  }, [currentDocument, documentsByFilename]);

  // Cleanup on unmount / tab change
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // No auto-fetch on tab switch; translation runs only when user clicks Translate

  useEffect(() => {
    console.log("[MultiLanguagePanel] Document changed:", {
      documentId: document_id,
      documentName: currentDocument?.name,
    });
    console.log("[MultiLanguagePanel] Clearing previous translation");
    setViewMode("translated");
    setTranslatedText(null);
    setTranslateError(null);
    setIsTranslating(false);
    abortControllerRef.current?.abort();
  }, [document_id, currentDocument?.name]);

  const fetchTranslation = async () => {
    if (!document_id) {
      toast({
        title: "No document selected",
        description: "Please select a document first.",
        variant: "destructive",
      });
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsTranslating(true);
    setTranslateError(null);

    try {
      const response = await fetch(
        `http://localhost:8080/document/${document_id}/translate`,
        {
          method: "POST",
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to translate document");
      }

      const payload = (await response.json()) as {
        translation?: string;
        translated_text?: string;
        translated_markdown?: string;
        translated?: string;
        text?: string;
      };

      const translated =
        payload.translated_markdown ||
        payload.translation ||
        payload.translated_text ||
        payload.translated ||
        payload.text ||
        "";

      setTranslatedText(translated || null);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (error.name !== "AbortError") {
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
      }
    } finally {
      setIsTranslating(false);
    }
  };

  // Native PDF export (lightweight, real text PDF)
  const downloadPDF = () => {
    if (!translatedRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = translatedRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Translated Document</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              line-height: 1.6;
            }
            img {
              max-width: 100%;
              height: auto;
              margin: 12px 0;
            }
            h1, h2, h3 {
              margin-top: 16px;
            }
            p {
              margin: 8px 0;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const renderHTML = (
    text: string | null,
    isLoading?: boolean,
    ref?: React.RefObject<HTMLDivElement>,
    proseClassName?: string,
  ) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading...
        </div>
      );
    }

    if (!text) {
      return (
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            No content available yet.
          </p>
        </div>
      );
    }

    const proseClasses =
      proseClassName ||
      "prose prose-sm prose-slate max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3 prose-strong:text-foreground prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:w-full prose-table:border-collapse prose-table:my-4 prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-foreground prose-ul:my-3 prose-ol:my-3 prose-li:text-foreground prose-li:my-1 prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-secondary prose-pre:text-secondary-foreground prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground [&>p]:mb-3 [&>p]:text-foreground [&>p]:text-sm";

    const cleaned = preprocessContent(text);

    return (
      <div
        ref={ref}
        className={proseClasses}
        dangerouslySetInnerHTML={{ __html: cleaned }}
      />
    );
  };

  /**
   * Render translated content. The translation API may return pure markdown,
   * HTML, or a mix of both (with spaced-out tags like "< td >").
   * preprocessTranslated handles all three: it normalises HTML tags, strips
   * images, then converts any remaining markdown syntax to HTML so we can
   * always render via dangerouslySetInnerHTML.
   */
  const renderTranslated = (
    text: string | null,
    isLoading?: boolean,
    ref?: React.RefObject<HTMLDivElement>,
    proseClassName?: string,
  ) => {
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
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            No content available yet.
          </p>
        </div>
      );
    }

    const proseClasses =
      proseClassName ||
      "prose prose-sm prose-slate max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3 prose-strong:text-foreground prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:w-full prose-table:border-collapse prose-table:my-4 prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-foreground prose-ul:my-3 prose-ol:my-3 prose-li:text-foreground prose-li:my-1 prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-secondary prose-pre:text-secondary-foreground prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground [&>p]:mb-3 [&>p]:text-foreground [&>p]:text-sm";

    const htmlContent = preprocessTranslated(text);

    return (
      <div
        ref={ref}
        className={proseClasses}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  const proseClasses =
    "prose prose-sm prose-slate max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3 prose-strong:text-foreground prose-strong:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:w-full prose-table:border-collapse prose-table:my-4 prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-foreground prose-ul:my-3 prose-ol:my-3 prose-li:text-foreground prose-li:my-1 prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-secondary prose-pre:text-secondary-foreground prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground [&>p]:mb-3 [&>p]:text-foreground [&>p]:text-sm";

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden max-h-full">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Languages className="w-4 h-4 text-primary" />
            Multi-Language View
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchTranslation()}
              disabled={!document_id || isTranslating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {isTranslating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Languages className="w-4 h-4" />
              )}
              Translate
            </button>
            {translatedText && viewMode !== "original" && (
              <button
                onClick={downloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            )}
            <div className="flex items-center rounded-lg border border-border/50 p-1">
              <button
                onClick={() => setViewMode("original")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
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
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 scrollbar-thin">
        {viewMode === "original" && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
              {renderHTML(originalText, false, undefined, proseClasses)}
            </div>
          </div>
        )}

        {viewMode === "translated" && (
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
              {translateError ? (
                <p className="text-sm text-destructive text-center py-6">
                  {translateError}
                </p>
              ) : (
                renderTranslated(
                  translatedText,
                  isTranslating,
                  translatedRef,
                  proseClasses,
                )
              )}
            </div>
          </div>
        )}

        {viewMode === "sideBySide" && (
          <div className="grid gap-4 md:grid-cols-2 min-w-0">
            <div className="space-y-4 min-w-0">
              <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Original
                </p>
                {renderHTML(originalText, false, undefined, proseClasses)}
              </div>
            </div>
            <div className="space-y-4 min-w-0">
              <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  English
                </p>
                {translateError ? (
                  <p className="text-sm text-destructive text-center py-6">
                    {translateError}
                  </p>
                ) : (
                  renderTranslated(
                    translatedText,
                    isTranslating,
                    translatedRef,
                    proseClasses,
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiLanguagePanel;
