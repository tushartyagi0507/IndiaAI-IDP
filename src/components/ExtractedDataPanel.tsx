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

  const selectedDocument = useExtractionStore((state) =>
    selectedFilename ? state.documentsByFilename[selectedFilename] : undefined,
  );
  const sampleRawHtml = selectedDocument?.html ?? "";
  const jsonData: Record<string, unknown> = selectedDocument?.json ?? {};

  // Process layout blocks for better formatting
  const processedContent = React.useMemo(() => {
    const firstPage = selectedDocument?.pages?.[0];
    if (
      !firstPage ||
      typeof firstPage !== "object" ||
      !("layout_blocks" in firstPage)
    ) {
      return {
        html: selectedDocument?.html ?? "",
        structuredFields: [],
      };
    }

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

    // Group blocks by type for structured data
    const structuredFields = filteredBlocks.map((block, index) => ({
      id: `field-${index}`,
      label: block.label
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      value: block.content.replace(/<[^>]*>/g, "").trim(),
      type: block.label,
      bbox: block.bbox,
    }));

    // Create cleaned HTML content
    const cleanHtml = filteredBlocks.map((block) => block.content).join("\n\n");

    return {
      html: cleanHtml,
      structuredFields,
    };
  }, [selectedDocument]);

  const structuredData: {
    field: string;
    value: string;
    region: { x: number; y: number; width: number; height: number };
  }[] = processedContent.structuredFields.map((field) => ({
    field: field.label,
    value: field.value,
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
                      __html: processedContent.html || sampleRawHtml,
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No content available. Upload a document to see extracted
                    data here.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === "structured" && (
          <div className="space-y-2">
            {filteredData.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No structured fields to display yet. Once your backend
                extraction is integrated, key-value pairs will appear here.
              </p>
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
                    <p className="text-sm font-medium truncate">{item.value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
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
