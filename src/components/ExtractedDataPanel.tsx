import { useState } from "react";
import { FileText, Table, Code, Copy, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewMode } from "@/types/document";
import { cn } from "@/lib/utils";

interface ExtractedDataPanelProps {
  onFieldHover?: (
    region: { x: number; y: number; width: number; height: number } | null,
  ) => void;
}

const ExtractedDataPanel = ({ onFieldHover }: ExtractedDataPanelProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("structured");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Placeholder values – real extracted content should come from your backend/AI pipeline.
  const sampleRawText = "";

  const structuredData: {
    field: string;
    value: string;
    region: { x: number; y: number; width: number; height: number };
  }[] = [];

  const jsonData: Record<string, unknown> = {};

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
    <div className="h-full flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden">
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
                <Table className="w-3 h-3" />
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
                onClick={() => handleCopy(sampleRawText, "raw")}
              >
                {copiedField === "raw" ? (
                  <Check className="w-4 h-4 text-emerald" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <pre className="p-4 rounded-xl bg-muted/50 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {sampleRawText ||
                  "No raw text available. Connect your extraction pipeline to display content here."}
              </pre>
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
            <pre className="p-4 rounded-xl bg-secondary text-secondary-foreground text-sm overflow-x-auto font-mono">
              <code>{JSON.stringify(jsonData, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractedDataPanel;
