import React, { useState } from "react";
import { FileText, Code, Copy, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewMode } from "@/types/document";
import { cn } from "@/lib/utils";
import { useExtractionStore } from "@/store/extractionStore";

interface ExtractedDataPanelProps {
  onFieldHover?: (
    region: { x: number; y: number; width: number; height: number } | null,
  ) => void;
  selectedFilename?: string | null;
}

const ExtractedDataPanel = ({
  onFieldHover,
  selectedFilename,
}: ExtractedDataPanelProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("raw");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const documentsByFilename = useExtractionStore(
    (state) => state.documentsByFilename,
  );
  const selectedDocument = useExtractionStore((state) =>
    selectedFilename ? state.documentsByFilename[selectedFilename] : undefined,
  );

  // Debug logging
  React.useEffect(() => {
    console.log("[ExtractedDataPanel] ======================");
    console.log("[ExtractedDataPanel] Selected filename:", selectedFilename);
    console.log(
      "[ExtractedDataPanel] Available filenames in store:",
      Object.keys(documentsByFilename),
    );
    console.log(
      "[ExtractedDataPanel] Exact match:",
      selectedFilename &&
        Object.prototype.hasOwnProperty.call(
          documentsByFilename,
          selectedFilename,
        ),
    );
    console.log("[ExtractedDataPanel] Selected document:", selectedDocument);
    if (selectedDocument) {
      console.log("[ExtractedDataPanel] Document data:", {
        filename: selectedDocument.filename,
        hasMarkdown: !!selectedDocument?.markdown,
        hasHtml: !!selectedDocument?.html,
        markdownLength: selectedDocument?.markdown?.length || 0,
        htmlLength: selectedDocument?.html?.length || 0,
        pagesCount: selectedDocument?.pages?.length || 0,
      });
    }
    console.log("[ExtractedDataPanel] ======================");
  }, [selectedFilename, selectedDocument, documentsByFilename]);

  const sampleRawHtml = selectedDocument?.html ?? "";
  const sampleRawMarkdown = selectedDocument?.markdown ?? "";
  const jsonData: Record<string, unknown> = selectedDocument?.json ?? {};

  // Process layout blocks for better formatting
  const processedContent = React.useMemo(() => {
    console.log("[ExtractedDataPanel] Processing content:", {
      hasPages: !!selectedDocument?.pages,
      pagesLength: selectedDocument?.pages?.length,
      firstPage: selectedDocument?.pages?.[0],
    });

    const pages = selectedDocument?.pages;
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      console.log("[ExtractedDataPanel] No pages found, using raw HTML");
      // Replace images with their alt text for a clean preview
      const htmlWithoutImages = (selectedDocument?.html ?? "")
        .replace(
          /<img[^>]*alt=["']([^"']*)["'][^>]*>/gi,
          '<span class="text-muted-foreground text-xs">Image: $1</span>',
        )
        .replace(
          /<img[^>]*>/gi,
          '<span class="text-muted-foreground text-xs">Image</span>',
        )
        .replace(
          /!\[([^\]]*)\]\([^)]+\)/g,
          (_match, alt) => `Image: ${alt || "No description"}`,
        );

      return {
        html: htmlWithoutImages,
        structuredFields: [],
      };
    }

    // Collect all layout blocks from all pages
    const allLayoutBlocks: Array<{
      bbox: [number, number, number, number];
      label: string;
      content: string;
      pageIndex: number;
    }> = [];

    pages.forEach((page, pageIndex) => {
      if (
        page &&
        typeof page === "object" &&
        "layout_blocks" in page &&
        Array.isArray(page.layout_blocks)
      ) {
        const pageBlocks = page.layout_blocks as Array<{
          bbox: [number, number, number, number];
          label: string;
          content: string;
        }>;

        // Add page index to each block for sorting
        pageBlocks.forEach((block) => {
          allLayoutBlocks.push({
            ...block,
            pageIndex,
          });
        });
      }
    });

    if (allLayoutBlocks.length === 0) {
      console.log(
        "[ExtractedDataPanel] No layout_blocks found across all pages, using raw HTML",
      );
      // Replace images with their alt text for a clean preview
      const htmlWithoutImages = (selectedDocument?.html ?? "")
        .replace(
          /<img[^>]*alt=["']([^"']*)["'][^>]*>/gi,
          '<span class="text-muted-foreground text-xs">Image: $1</span>',
        )
        .replace(
          /<img[^>]*>/gi,
          '<span class="text-muted-foreground text-xs">Image</span>',
        )
        .replace(
          /!\[([^\]]*)\]\([^)]+\)/g,
          (_match, alt) => `Image: ${alt || "No description"}`,
        );

      return {
        html: htmlWithoutImages,
        structuredFields: [],
      };
    }

    console.log("[ExtractedDataPanel] Found layout_blocks across all pages:", {
      totalCount: allLayoutBlocks.length,
      pagesWithBlocks: pages.length,
      labels: allLayoutBlocks.slice(0, 10).map((b) => b.label),
    });

    // Sort blocks by page order first, then by vertical position (top to bottom), then left to right
    const sortedBlocks = [...allLayoutBlocks].sort((a, b) => {
      // First sort by page index
      if (a.pageIndex !== b.pageIndex) {
        return a.pageIndex - b.pageIndex;
      }

      // Then sort by vertical position within the same page
      const [, aY] = a.bbox;
      const [, bY] = b.bbox;
      if (Math.abs(aY - bY) < 50) {
        // Same row
        return a.bbox[0] - b.bbox[0]; // Sort by x position
      }
      return aY - bY; // Sort by y position
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

    console.log("[ExtractedDataPanel] After filtering:", {
      filteredCount: filteredBlocks.length,
      pagesProcessed: Math.max(...filteredBlocks.map((b) => b.pageIndex)) + 1,
    });

    // Group blocks by type for structured data
    const structuredFields = filteredBlocks.map((block, index) => ({
      id: `field-${index}`,
      label: block.label
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      value: block.content.replace(/<[^>]*>/g, "").trim(),
      htmlContent: block.content,
      type: block.label,
      bbox: block.bbox,
      pageIndex: block.pageIndex,
    }));

    console.log("[ExtractedDataPanel] Structured fields:", {
      count: structuredFields.length,
      pagesWithFields: [...new Set(structuredFields.map((f) => f.pageIndex))]
        .length,
      fields: structuredFields.slice(0, 3).map((f) => ({
        label: f.label,
        valuePreview: f.value.substring(0, 50),
        page: f.pageIndex + 1,
      })),
    });

    // Create cleaned HTML content from all pages - replace images with alt text
    const cleanHtml = filteredBlocks
      .map((block) => block.content)
      .join("\n\n")
      .replace(
        /<img[^>]*alt=["']([^"']*)["'][^>]*>/gi,
        '<span class="text-muted-foreground text-xs">Image: $1</span>',
      )
      .replace(
        /<img[^>]*>/gi,
        '<span class="text-muted-foreground text-xs">Image</span>',
      )
      .replace(
        /!\[([^\]]*)\]\([^)]+\)/g,
        (_match, alt) => `Image: ${alt || "No description"}`,
      );

    return {
      html: cleanHtml,
      structuredFields,
    };
  }, [selectedDocument]);

  const structuredData: {
    field: string;
    value: string;
    htmlContent: string;
    type: string;
    region: { x: number; y: number; width: number; height: number };
  }[] = processedContent.structuredFields.map((field) => ({
    field: field.label,
    value: field.value,
    htmlContent: field.htmlContent,
    type: field.type,
    region: {
      x: field.bbox[0],
      y: field.bbox[1],
      width: field.bbox[2] - field.bbox[0],
      height: field.bbox[3] - field.bbox[1],
    },
  }));

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredData = structuredData.filter(
    (item) =>
      item.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.value.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden max-h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Extracted Data</h3>
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="raw" className="h-6 text-xs gap-1.5">
                <FileText className="w-3 h-3" />
                Raw
              </TabsTrigger>
              <TabsTrigger value="structured" className="h-6 text-xs gap-1.5">
                <Search className="w-3 h-3" />
                Structured
              </TabsTrigger>
              <TabsTrigger value="json" className="h-6 text-xs gap-1.5">
                <Code className="w-3 h-3" />
                JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search extracted data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 scrollbar-thin">
        {viewMode === "raw" && (
          <div className="space-y-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={() =>
                  handleCopy(processedContent.html || sampleRawHtml, "raw")
                }
              >
                {copiedField === "raw" ? (
                  <Check className="w-4 h-4 text-emerald" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
                {processedContent.html || sampleRawHtml ? (
                  <div
                    className="prose prose-sm prose-slate max-w-none
                      prose-headings:text-foreground prose-headings:font-semibold
                      prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-table:w-full prose-table:border-collapse prose-table:my-4
                      prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
                      prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-foreground
                      prose-ul:my-3 prose-ol:my-3
                      prose-li:text-foreground prose-li:my-1
                      prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                      prose-pre:bg-secondary prose-pre:text-secondary-foreground prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
                      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
                      [&>p]:mb-3 [&>p]:text-foreground [&>p]:text-sm"
                    dangerouslySetInnerHTML={{
                      __html: (processedContent.html || sampleRawHtml)
                        .replace(
                          /<img[^>]*alt=["']([^"']*)["'][^>]*>/gi,
                          '<span class="text-muted-foreground text-xs">Image: $1</span>',
                        )
                        .replace(
                          /<img[^>]*>/gi,
                          '<span class="text-muted-foreground text-xs">Image</span>',
                        )
                        .replace(
                          /!\[([^\]]*)\]\([^)]+\)/g,
                          (_match, alt) => `Image: ${alt || "No description"}`,
                        ),
                    }}
                  />
                ) : sampleRawMarkdown ? (
                  <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap text-foreground">
                    {sampleRawMarkdown.replace(
                      /!\[([^\]]*)\]\([^)]+\)/g,
                      (_match, alt) => `Image: ${alt || "No description"}`,
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      No extracted content available yet.
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Debug: selectedFilename = {selectedFilename || "null"},
                      hasDocument = {selectedDocument ? "yes" : "no"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === "structured" && (
          <div className="space-y-2">
            {filteredData.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-muted-foreground">
                  No structured fields available
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Debug: processedContent.structuredFields.length ={" "}
                  {processedContent.structuredFields.length}, hasPages ={" "}
                  {selectedDocument?.pages?.length || 0}, hasLayoutBlocks ={" "}
                  {selectedDocument?.pages?.[0] &&
                  typeof selectedDocument.pages[0] === "object" &&
                  selectedDocument.pages[0] !== null &&
                  "layout_blocks" in selectedDocument.pages[0]
                    ? "yes"
                    : "no"}
                </p>
              </div>
            )}
            {filteredData.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "group p-3 rounded-xl border border-border/50 transition-all duration-200 cursor-pointer",
                  "hover:border-primary/30 hover:bg-primary/5",
                )}
                onMouseEnter={() => onFieldHover?.(item.region)}
                onMouseLeave={() => onFieldHover?.(null)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {item.field}
                    </p>
                    {item.type === "Table" ? (
                      <div
                        className="text-sm overflow-x-auto prose prose-sm max-w-none
                          prose-table:w-full prose-table:border-collapse prose-table:my-1
                          prose-th:border prose-th:border-border prose-th:bg-muted/50 prose-th:px-2 prose-th:py-1 prose-th:text-left prose-th:text-xs prose-th:font-semibold
                          prose-td:border prose-td:border-border prose-td:px-2 prose-td:py-1 prose-td:text-xs"
                        dangerouslySetInnerHTML={{ __html: item.htmlContent }}
                      />
                    ) : (
                      <p className="text-sm font-medium whitespace-pre-wrap">
                        {item.value}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item.value, item.field);
                    }}
                  >
                    {copiedField === item.field ? (
                      <Check className="w-3.5 h-3.5 text-emerald" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === "json" && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 z-10"
              onClick={() =>
                handleCopy(JSON.stringify(jsonData, null, 2), "json")
              }
            >
              {copiedField === "json" ? (
                <Check className="w-4 h-4 text-emerald" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
              <pre className="text-sm overflow-x-auto font-mono text-foreground">
                <code>{JSON.stringify(jsonData, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractedDataPanel;
