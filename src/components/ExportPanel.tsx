import { useState } from "react";
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  Check,
  Eye,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportFormat } from "@/types/document";
import { cn } from "@/lib/utils";

const ExportPanel = () => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [selectedFields, setSelectedFields] = useState<string[]>(['all']);
  const [showPreview, setShowPreview] = useState(false);

  const formats = [
    { id: 'json' as const, label: 'JSON', icon: FileJson, description: 'Structured data format' },
    { id: 'csv' as const, label: 'CSV', icon: FileSpreadsheet, description: 'Spreadsheet compatible' },
    { id: 'doc' as const, label: 'DOC', icon: FileText, description: 'Word document' },
  ];

  const fields = [
    { id: 'all', label: 'All Fields' },
    { id: 'title', label: 'Document Title' },
    { id: 'date', label: 'Date' },
    { id: 'department', label: 'Department' },
    { id: 'budget', label: 'Budget Allocation' },
    { id: 'jobs', label: 'Expected Jobs' },
    { id: 'tables', label: 'Tables' },
    { id: 'summary', label: 'AI Summary' },
  ];

  const toggleField = (fieldId: string) => {
    if (fieldId === 'all') {
      setSelectedFields(['all']);
    } else {
      setSelectedFields(prev => {
        const newSelection = prev.filter(f => f !== 'all');
        if (newSelection.includes(fieldId)) {
          return newSelection.filter(f => f !== fieldId);
        }
        return [...newSelection, fieldId];
      });
    }
  };

  const previewContent = {
    json: `{
  "document": {
    "title": "India AI Development Report",
    "date": "2024-01-15",
    "department": "Ministry of Electronics & IT"
  },
  "financials": {
    "budget": "₹10,000 Crores",
    "expectedJobs": 500000
  }
}`,
    csv: `Field,Value
Document Title,India AI Development Report
Date,2024-01-15
Department,Ministry of Electronics & IT
Budget Allocation,₹10,000 Crores
Expected Jobs,500000`,
    doc: `INDIA AI DEVELOPMENT REPORT

Document Information:
- Title: India AI Development Report
- Date: January 15, 2024
- Department: Ministry of Electronics & IT

Financial Overview:
- Budget Allocation: ₹10,000 Crores
- Expected Jobs: 500,000`,
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          Export Options
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Format Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">Export Format</label>
          <div className="grid grid-cols-3 gap-3">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                  selectedFormat === format.id
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                <format.icon className={cn(
                  "w-8 h-8",
                  selectedFormat === format.id ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-sm font-medium">{format.label}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {format.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Field Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">Select Fields</label>
          <div className="grid grid-cols-2 gap-2">
            {fields.map((field) => (
              <label
                key={field.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  selectedFields.includes(field.id) || selectedFields.includes('all')
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50 hover:border-primary/20"
                )}
              >
                <Checkbox
                  checked={selectedFields.includes(field.id) || selectedFields.includes('all')}
                  onCheckedChange={() => toggleField(field.id)}
                />
                <span className="text-sm">{field.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview Toggle */}
        <div className="border-t border-border/50 pt-4">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowPreview(!showPreview)}
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview Export
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              showPreview && "rotate-180"
            )} />
          </Button>

          {showPreview && (
            <div className="mt-3 animate-fade-in">
              <pre className="p-4 rounded-xl bg-secondary text-secondary-foreground text-xs overflow-x-auto font-mono max-h-48 scrollbar-thin">
                {previewContent[selectedFormat]}
              </pre>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            Export Selected
          </Button>
          <Button variant="hero" className="flex-1">
            <Download className="w-4 h-4" />
            Download {selectedFormat.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
