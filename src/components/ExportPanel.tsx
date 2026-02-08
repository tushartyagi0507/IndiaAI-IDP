// import { useState } from "react";
// import {
//   Download,
//   FileJson,
//   FileSpreadsheet,
//   FileText,
//   Check,
//   Eye,
//   ChevronDown,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// import { ExportFormat } from "@/types/document";
// import { cn } from "@/lib/utils";

// const ExportPanel = () => {
//   const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");
//   const [showPreview, setShowPreview] = useState(false);

//   const formats = [
//     {
//       id: "json" as const,
//       label: "JSON",
//       icon: FileJson,
//       description: "Structured data format",
//     },
//     {
//       id: "csv" as const,
//       label: "CSV",
//       icon: FileSpreadsheet,
//       description: "Spreadsheet compatible",
//     },
//     {
//       id: "doc" as const,
//       label: "DOC",
//       icon: FileText,
//       description: "Word document",
//     },
//   ];

//   const fields = [
//     { id: "all", label: "All Fields" },
//     { id: "title", label: "Document Title" },
//     { id: "date", label: "Date" },
//     { id: "department", label: "Department" },
//     { id: "budget", label: "Budget Allocation" },
//     { id: "jobs", label: "Expected Jobs" },
//     { id: "tables", label: "Tables" },
//     { id: "summary", label: "AI Summary" },
//   ];

//   const previewContent = {
//     json: `// Preview unavailable
// // Connect your export pipeline to see a JSON preview of the extracted document data here.`,
//     csv: `# Preview unavailable
// # Connect your export pipeline to see a CSV preview of the extracted document data here.`,
//     doc: `Preview unavailable.

// Connect your export pipeline to see a document preview generated from the extracted data.`,
//   };

//   return (
//     <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
//       <div className="p-4 border-b border-border/50">
//         <h3 className="font-display font-semibold flex items-center gap-2">
//           <Download className="w-4 h-4 text-primary" />
//           Export Options
//         </h3>
//       </div>

//       <div className="p-4 space-y-6">
//         {/* Format Selection */}
//         <div>
//           <label className="text-sm font-medium mb-3 block">
//             Export Format
//           </label>
//           <div className="grid grid-cols-3 gap-3">
//             {formats.map((format) => (
//               <button
//                 key={format.id}
//                 onClick={() => setSelectedFormat(format.id)}
//                 className={cn(
//                   "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
//                   selectedFormat === format.id
//                     ? "border-primary bg-primary/5"
//                     : "border-border/50 hover:border-primary/30 hover:bg-muted/30",
//                 )}
//               >
//                 <format.icon
//                   className={cn(
//                     "w-8 h-8",
//                     selectedFormat === format.id
//                       ? "text-primary"
//                       : "text-muted-foreground",
//                   )}
//                 />
//                 <span className="text-sm font-medium">{format.label}</span>
//                 <span className="text-xs text-muted-foreground text-center">
//                   {format.description}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Preview Toggle */}
//         <div className="border-t border-border/50 pt-4">
//           <Button
//             variant="outline"
//             className="w-full justify-between"
//             onClick={() => setShowPreview(!showPreview)}
//           >
//             <span className="flex items-center gap-2">
//               <Eye className="w-4 h-4" />
//               Preview Export
//             </span>
//             <ChevronDown
//               className={cn(
//                 "w-4 h-4 transition-transform",
//                 showPreview && "rotate-180",
//               )}
//             />
//           </Button>

//           {showPreview && (
//             <div className="mt-3 animate-fade-in">
//               <pre className="p-4 rounded-xl bg-secondary text-secondary-foreground text-xs overflow-x-auto font-mono max-h-48 scrollbar-thin">
//                 {previewContent[selectedFormat]}
//               </pre>
//             </div>
//           )}
//         </div>

//         {/* Export Buttons */}
//         <div className="flex gap-3">
//           <Button variant="outline" className="flex-1">
//             Export Selected
//           </Button>
//           <Button variant="hero" className="flex-1">
//             <Download className="w-4 h-4" />
//             Download {selectedFormat.toUpperCase()}
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ExportPanel;

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Eye,
  ChevronDown,
  Loader2,
} from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExportFormat } from "@/types/document";
import { useExtractionStore } from "@/store/extractionStore";
import useUserCategory from "@/store/userCategory";

const ExportPanel = () => {
  const batch_id = useExtractionStore((state) => state.batchId);
  const currentDocument = useExtractionStore((state) => state.currentDocument);

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");

  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "http://localhost:8080";

  const previewRef = useRef<HTMLPreElement>(null);

  // BUG FIX: useUserCategory() returns "" when user clicks Export/Download.
  // Verified: the 422 error response shows "input": null for doc_type field.
  // Root cause: useUserCategory() zustand store becomes empty after upload
  // (same issue documented in TableViewer.tsx lines 48-50).
  //
  // Fix: Read category from currentDocument.category instead. This value is
  // set at upload time (DocumentUpload.tsx line ~590: category: storedCategoryKey)
  // when the store IS still populated, and persists on the document object in
  // extractionStore independently of the useUserCategory store lifecycle.
  // const { category } = useUserCategory();
  const category = currentDocument?.category ?? "";

  const formats = [
    {
      id: "json" as const,
      label: "JSON",
      icon: FileJson,
      description: "Structured data format",
    },
    {
      id: "csv" as const,
      label: "Excel",
      icon: FileSpreadsheet,
      description: "Spreadsheet compatible",
    },
    /*
    {
      id: "doc" as const,
      label: "DOC",
      icon: FileText,
      description: "Word document",
    },
    */
  ];

  /* ----------------------------------------
     Auto-scroll preview when content changes
  ---------------------------------------- */
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [previewContent]);

  /* ----------------------------------------
     API Calls
  ---------------------------------------- */
  const fetchPreview = async () => {
    if (!batch_id) {
      setError("Batch ID not found");
      return;
    }

    try {
      setLoadingPreview(true);
      setError(null);

      if (selectedFormat === "json") {
        const res = await axios.get(`${API_BASE}/batch/${batch_id}/json`);

        setPreviewContent(JSON.stringify(res.data, null, 2));
      } else {
        const formData = new FormData();
        formData.append("doc_type", category);
        const res = await axios.post(
          `${API_BASE}/batch/${batch_id}/export/excel`,
          formData,
          { responseType: "blob" },
        );

        setPreviewContent(
          `Excel file ready for download.\n\nFile size: ${(
            res.data.size / 1024
          ).toFixed(2)} KB\n\nClick Download to save the file.`,
        );
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!batch_id) return;

    try {
      setDownloading(true);
      setError(null);

      let res;
      let filename;
      let blob;

      if (selectedFormat === "json") {
        // JSON remains a GET request
        res = await axios.get(`${API_BASE}/batch/${batch_id}/json`);
        blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: "application/json",
        });
        filename = `batch_${batch_id}.json`;
      } else {
        // EXCEL is now a POST request with Form Data
        const formData = new FormData();

        formData.append("doc_type", category);

        res = await axios.post(
          `${API_BASE}/batch/${batch_id}/export/excel`,
          formData,
          {
            responseType: "blob", // This must be in the config object (3rd argument)
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        blob = res.data;
        filename = `batch_${batch_id}.xlsx`;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download Error:", err);
      setError("Download failed. Please check if the document type is valid.");
    } finally {
      setDownloading(false);
    }
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
          <label className="text-sm font-medium mb-3 block">
            Export Format
          </label>

          <div className="grid grid-cols-2 gap-3">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => {
                  setSelectedFormat(format.id);
                  setPreviewContent("");
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                  selectedFormat === format.id
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-primary/30 hover:bg-muted/30",
                )}
              >
                <format.icon
                  className={cn(
                    "w-8 h-8",
                    selectedFormat === format.id
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
                <span className="text-sm font-medium">{format.label}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {format.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Toggle */}
        <div className="border-t border-border/50 pt-4">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => {
              setShowPreview((prev) => !prev);
              if (!previewContent) {
                fetchPreview();
              }
            }}
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview Export
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                showPreview && "rotate-180",
              )}
            />
          </Button>

          {showPreview && (
            <div className="mt-3 animate-fade-in">
              <pre
                ref={previewRef}
                className="p-4 rounded-xl bg-secondary text-secondary-foreground text-xs overflow-y-auto font-mono max-h-64 scrollbar-thin whitespace-pre-wrap"
              >
                {loadingPreview && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading preview...
                  </span>
                )}

                {error && <span className="text-destructive">{error}</span>}

                {!loadingPreview && !error && previewContent}
              </pre>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3">
          <Button
            variant="hero"
            className="flex-1"
            disabled={downloading}
            onClick={handleDownload}
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download {selectedFormat.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
