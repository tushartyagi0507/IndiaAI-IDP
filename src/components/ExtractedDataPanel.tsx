import { useState } from "react";
import { 
  FileText, 
  Table, 
  Code, 
  Copy, 
  Check,
  Search,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewMode } from "@/types/document";
import { cn } from "@/lib/utils";

interface ExtractedDataPanelProps {
  onFieldHover?: (region: { x: number; y: number; width: number; height: number } | null) => void;
}

const ExtractedDataPanel = ({ onFieldHover }: ExtractedDataPanelProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('structured');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const sampleRawText = `भारत में आर्टिफिशियल इंटेलिजेंस का विकास

India has emerged as a global leader in AI innovation, with significant investments in research and development. The government's National AI Strategy aims to position India as an AI powerhouse by 2025.

Key Focus Areas:
1. Healthcare AI Solutions
2. Agricultural Technology
3. Smart City Infrastructure
4. Financial Services Automation

Budget Allocation: ₹10,000 Crores
Expected Impact: 500,000 new jobs
Target Completion: December 2025`;

  const structuredData = [
    { field: 'Document Title', value: 'India AI Development Report', region: { x: 10, y: 5, width: 60, height: 5 } },
    { field: 'Date', value: '15 January 2024', region: { x: 10, y: 12, width: 20, height: 3 } },
    { field: 'Department', value: 'Ministry of Electronics & IT', region: { x: 10, y: 16, width: 35, height: 3 } },
    { field: 'Budget Allocation', value: '₹10,000 Crores', region: { x: 10, y: 45, width: 25, height: 4 } },
    { field: 'Expected Jobs', value: '500,000', region: { x: 10, y: 50, width: 20, height: 4 } },
    { field: 'Target Year', value: '2025', region: { x: 10, y: 55, width: 15, height: 4 } },
    { field: 'Status', value: 'In Progress', region: { x: 70, y: 55, width: 20, height: 4 } },
  ];

  const jsonData = {
    document: {
      title: 'India AI Development Report',
      date: '2024-01-15',
      department: 'Ministry of Electronics & IT',
    },
    financials: {
      budget: 10000,
      currency: 'INR Crores',
    },
    projections: {
      jobs: 500000,
      targetYear: 2025,
    },
    status: 'in_progress',
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredData = structuredData.filter(
    item => 
      item.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Extracted Data</h3>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
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
        {viewMode === 'raw' && (
          <div className="space-y-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={() => handleCopy(sampleRawText, 'raw')}
              >
                {copiedField === 'raw' ? (
                  <Check className="w-4 h-4 text-emerald" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <pre className="p-4 rounded-xl bg-muted/50 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {sampleRawText}
              </pre>
            </div>
          </div>
        )}

        {viewMode === 'structured' && (
          <div className="space-y-2">
            {filteredData.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "group p-3 rounded-xl border border-border/50 transition-all duration-200 cursor-pointer",
                  "hover:border-primary/30 hover:bg-primary/5"
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

        {viewMode === 'json' && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 z-10"
              onClick={() => handleCopy(JSON.stringify(jsonData, null, 2), 'json')}
            >
              {copiedField === 'json' ? (
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
