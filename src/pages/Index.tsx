// import { useEffect, useState } from "react";
// import Header from "@/components/Header";
// import DocumentUpload from "@/components/DocumentUpload";
// import DocumentPreview from "@/components/DocumentPreview";
// import ExtractedDataPanel from "@/components/ExtractedDataPanel";
// import SummaryPanel from "@/components/SummaryPanel";
// import TableViewer from "@/components/TableViewer";
// import MultiLanguagePanel from "@/components/MultiLanguagePanel";
// import ExportPanel from "@/components/ExportPanel";
// import { UploadedDocument } from "@/types/document";
// import { cn } from "@/lib/utils";
// import { useExtractionStore } from "@/store/extractionStore";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// const Index = () => {
//   // Track all uploaded documents
//   const [uploadedDocuments, setUploadedDocuments] = useState<
//     UploadedDocument[]
//   >([]);
//   // Track the currently selected document
//   const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
//     null,
//   );
//   const [currentBackendDocumentId, setCurrentBackendDocumentId] = useState<
//     string | null
//   >(null);

//   // Get the current document from the array
//   const currentDocument =
//     uploadedDocuments.find((doc) => doc.id === currentDocumentId) || null;

//   // Debug: Log current document info
//   useEffect(() => {
//     if (currentDocument) {
//       console.log("Index - Current document:", {
//         id: currentDocument.id,
//         name: currentDocument.name,
//         hasFile: !!currentDocument.file,
//         fileType: currentDocument.file?.type,
//         fileName: currentDocument.file?.name,
//       });
//     }
//   }, [currentDocument]);
//   const documentsByFilename = useExtractionStore(
//     (state) => state.documentsByFilename,
//   );
//   const setCurrentDocument = useExtractionStore(
//     (state) => state.setCurrentDocument,
//   );
//   const [highlightedRegion, setHighlightedRegion] = useState<{
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//   } | null>(null);
//   const [activeTab, setActiveTab] = useState<
//     "extract" | "summary" | "tables" | "language" | "export"
//   >("extract");

//   const handleDocumentUpload = (document: UploadedDocument) => {
//     console.log("Index - Document uploaded:", {
//       id: document.id,
//       name: document.name,
//       hasFile: !!document.file,
//       fileType: document.file?.type,
//       fileName: document.file?.name,
//     });
//     const backendDocumentId =
//       documentsByFilename[document.name]?.documentId ?? undefined;
//     setUploadedDocuments((prev) => {
//       // Check if document already exists (by id)
//       const exists = prev.some((doc) => doc.id === document.id);
//       if (exists) {
//         // Update existing document - preserve file object
//         return prev.map((doc) =>
//           doc.id === document.id ? { ...document, backendDocumentId } : doc,
//         );
//       }
//       // Add new document - ensure file is included
//       return [...prev, { ...document, backendDocumentId }];
//     });
//     // Set as current document
//     setCurrentDocumentId(document.id);
//     setCurrentBackendDocumentId(backendDocumentId ?? null);
//     // Update Zustand store with uploaded document
//     setCurrentDocument(
//       { ...document, backendDocumentId },
//       backendDocumentId ?? null,
//     );
//   };

//   const handleDocumentSelect = (documentId: string) => {
//     setCurrentDocumentId(documentId);
//     const selected = uploadedDocuments.find((doc) => doc.id === documentId);
//     const backendId =
//       selected?.backendDocumentId ||
//       (selected ? documentsByFilename[selected.name]?.documentId : null);
//     setCurrentBackendDocumentId(backendId ?? null);
//     // Update Zustand store with selected document
//     setCurrentDocument(selected || null, backendId ?? null);
//   };

//   const handleUploadNew = () => {
//     // Keep existing documents but go back to upload view
//     setCurrentDocumentId(null);
//     setCurrentBackendDocumentId(null);
//     // Clear current document in Zustand store
//     setCurrentDocument(null, null);
//   };

//   useEffect(() => {
//     if (!documentsByFilename || uploadedDocuments.length === 0) {
//       return;
//     }
//     setUploadedDocuments((prev) =>
//       prev.map((doc) => {
//         const backendId = documentsByFilename[doc.name]?.documentId;
//         if (!backendId || doc.backendDocumentId === backendId) {
//           return doc;
//         }
//         // Preserve file object when updating backendDocumentId
//         return { ...doc, backendDocumentId: backendId };
//       }),
//     );
//     if (currentDocument) {
//       const backendId =
//         documentsByFilename[currentDocument.name]?.documentId ?? null;
//       if (backendId && backendId !== currentBackendDocumentId) {
//         setCurrentBackendDocumentId(backendId);
//         // Update Zustand store when backend ID becomes available
//         setCurrentDocument(currentDocument, backendId);
//       }
//     }
//   }, [
//     currentBackendDocumentId,
//     currentDocument,
//     documentsByFilename,
//     uploadedDocuments.length,
//     setCurrentDocument,
//   ]);

//   const handleFieldHover = (
//     region: { x: number; y: number; width: number; height: number } | null,
//   ) => {
//     setHighlightedRegion(region);
//   };

//   const handleCitationClick = (
//     pageNumber: number,
//     region: { x: number; y: number; width: number; height: number },
//   ) => {
//     setHighlightedRegion(region);
//     // In a real app, this would also navigate to the page
//   };

//   const tabs = [
//     { id: "extract", label: "Extracted Data" },
//     { id: "summary", label: "AI Summary" },
//     { id: "tables", label: "Tables" },
//     { id: "language", label: "Translation" },
//     { id: "export", label: "Export" },
//   ] as const;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
//       <Header />

//       <main className="container px-4 py-8">
//         {/* Hero Section - Visible when no document selected */}
//         {!currentDocument && (
//           <div className="max-w-4xl mx-auto mb-12 text-center animate-fade-in">
//             {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
//               <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
//               Powered by AI
//             </div> */}
//             <h1 className="text-4xl md:text-5xl lg:text-5xl font-display font-bold mb-4 leading-tight">
//               Transform Documents with
//               <span className="block gradient-text">India AI Intelligence</span>
//             </h1>
//             <p className="text-md text-muted-foreground max-w-2xl mx-auto mb-8">
//               Extract, analyze, and summarize documents in multiple languages.
//               Experience the power of AI-driven document processing made in
//               India.
//             </p>
//           </div>
//         )}

//         {/* Upload Section */}
//         {!currentDocument && (
//           <div
//             className="max-w-3xl mx-auto animate-slide-up"
//             style={{ animationDelay: "0.2s" }}
//           >
//             <DocumentUpload onDocumentUpload={handleDocumentUpload} />

//             {/* Show dropdown of previously uploaded files */}
//             {uploadedDocuments.length > 0 && (
//               <div className="mt-6 p-4 rounded-xl bg-card border border-border/50">
//                 <p className="text-sm text-muted-foreground mb-3">
//                   Or select from previously uploaded documents:
//                 </p>
//                 <Select onValueChange={handleDocumentSelect}>
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select a document" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {uploadedDocuments.map((doc) => (
//                       <SelectItem key={doc.id} value={doc.id}>
//                         <div className="flex items-center gap-2">
//                           <span>📄</span>
//                           <span>{doc.name}</span>
//                           <span className="text-xs text-muted-foreground">
//                             ({doc.pageCount} pages)
//                           </span>
//                         </div>
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Document Processing View */}
//         {currentDocument && (
//           <div className="space-y-6 animate-fade-in">
//             {/* Document Info Bar with Dropdown */}
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/50">
//               <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
//                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-emerald/20 flex items-center justify-center shrink-0">
//                   <span className="text-xl">📄</span>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   {/* Dropdown for selecting uploaded documents - always visible */}
//                   {uploadedDocuments.length > 0 && (
//                     <Select
//                       value={currentDocumentId || undefined}
//                       onValueChange={handleDocumentSelect}
//                     >
//                       <SelectTrigger className="w-full sm:w-auto min-w-[280px] max-w-[500px] border-2 border-primary/30 bg-background h-auto font-semibold text-foreground hover:border-primary/50 hover:bg-muted/30 rounded-lg px-4 py-2.5 shadow-sm">
//                         <SelectValue placeholder="Select a document" />
//                       </SelectTrigger>
//                       <SelectContent className="max-h-[300px]">
//                         {uploadedDocuments.map((doc) => (
//                           <SelectItem key={doc.id} value={doc.id}>
//                             <div className="flex items-center gap-2">
//                               <span>📄</span>
//                               <span className="truncate">{doc.name}</span>
//                               {/* {doc.pageCount && (
//                                 <span className="text-xs text-muted-foreground">
//                                   ({doc.pageCount} pages)
//                                 </span>
//                               )} */}
//                             </div>
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   )}
//                   <p className="text-sm text-muted-foreground mt-2">
//                     {currentDocument.pageCount} pages • Processed successfully
//                     {uploadedDocuments.length > 1 && (
//                       <span className="ml-2">
//                         • {uploadedDocuments.length} files uploaded
//                       </span>
//                     )}
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={handleUploadNew}
//                 className="text-sm text-primary hover:underline whitespace-nowrap shrink-0"
//               >
//                 Upload New Document
//               </button>
//             </div>

//             {/* Main Content Grid */}
//             <div className="grid lg:grid-cols-2 gap-6">
//               {/* Left - Document Preview */}
//               <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-200px)]">
//                 <DocumentPreview
//                   documentName={currentDocument.name}
//                   file={currentDocument.file}
//                   highlightedRegion={highlightedRegion}
//                   key={currentDocument.id}
//                 />
//               </div>

//               {/* Right - Data Panels */}
//               <div className="space-y-6">
//                 {/* Tab Navigation */}
//                 <div className="flex gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto">
//                   {tabs.map((tab) => (
//                     <button
//                       key={tab.id}
//                       onClick={() => setActiveTab(tab.id as typeof activeTab)}
//                       className={cn(
//                         "flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
//                         activeTab === tab.id
//                           ? "bg-card text-foreground shadow-sm"
//                           : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
//                       )}
//                     >
//                       {tab.label}
//                     </button>
//                   ))}
//                 </div>

//                 {/* Tab Content */}
//                 <div className="min-h-[500px] lg:h-[calc(100vh-350px)]">
//                   {activeTab === "extract" && (
//                     <ExtractedDataPanel
//                       onFieldHover={handleFieldHover}
//                       selectedFilename={currentDocument?.name || null}
//                     />
//                   )}
//                   {activeTab === "summary" && (
//                     <SummaryPanel onCitationClick={handleCitationClick} />
//                   )}
//                   {activeTab === "tables" && <TableViewer />}
//                   {activeTab === "language" && <MultiLanguagePanel />}
//                   {activeTab === "export" && <ExportPanel />}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Features Grid - Visible when no document selected */}
//         {!currentDocument && (
//           <div
//             id="features"
//             className="max-w-5xl mx-auto mt-20 animate-slide-up scroll-mt-24"
//             style={{ animationDelay: "0.4s" }}
//           >
//             <h2 className="text-2xl font-display font-bold text-center mb-8">
//               Powerful Features
//             </h2>
//             <div className="grid md:grid-cols-3 gap-6">
//               {[
//                 {
//                   icon: "🔍",
//                   title: "Smart Extraction",
//                   desc: "Extract text, tables, and structured data automatically",
//                 },
//                 {
//                   icon: "🌐",
//                   title: "Multi-Language",
//                   desc: "Support for Hindi, English, and 50+ languages",
//                 },
//                 {
//                   icon: "✨",
//                   title: "AI Summaries",
//                   desc: "Generate cited summaries with one click",
//                 },
//                 {
//                   icon: "📊",
//                   title: "Table Detection",
//                   desc: "Identify and export tables as spreadsheets",
//                 },
//                 {
//                   icon: "🔗",
//                   title: "Smart Linking",
//                   desc: "Click on summaries to see source regions",
//                 },
//                 {
//                   icon: "📥",
//                   title: "Flexible Export",
//                   desc: "Download as JSON, CSV, or Word documents",
//                 },
//               ].map((feature, idx) => (
//                 <div
//                   key={idx}
//                   className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
//                 >
//                   <span className="text-3xl mb-4 block">{feature.icon}</span>
//                   <h3 className="font-display font-semibold mb-2">
//                     {feature.title}
//                   </h3>
//                   <p className="text-sm text-muted-foreground">
//                     {feature.desc}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </main>

//       {/* Footer */}
//       <footer className="border-t border-border/50 mt-20 py-8">
//         <div className="container px-4 text-center text-sm text-muted-foreground">
//           <p>
//             @2026 India AI Developed by{" "}
//             <a
//               href="https://www.neuralix.ai"
//               className="text-primary hover:underline"
//             >
//               Neuralix
//             </a>
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Index;

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentPreview from "@/components/DocumentPreview";
import ExtractedDataPanel from "@/components/ExtractedDataPanel";
import SummaryPanel from "@/components/SummaryPanel";
import TableViewer from "@/components/TableViewer";
import MultiLanguagePanel from "@/components/MultiLanguagePanel";
import ExportPanel from "@/components/ExportPanel";
import { UploadedDocument } from "@/types/document";
import { cn } from "@/lib/utils";
import { useExtractionStore } from "@/store/extractionStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import useUserCategory from "@/store/userCategory";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    null,
  );
  const [currentBackendDocumentId, setCurrentBackendDocumentId] = useState<
    string | null
  >(null);
  // When true, upload view is "add to current setup" (locked to current category)
  const [isAddToCurrentSetup, setIsAddToCurrentSetup] = useState(false);

  const currentDocument =
    uploadedDocuments.find((doc) => doc.id === currentDocumentId) || null;

  const documentsByFilename = useExtractionStore(
    (state) => state.documentsByFilename,
  );
  const setCurrentDocument = useExtractionStore(
    (state) => state.setCurrentDocument,
  );
  const clearResults = useExtractionStore((state) => state.clearResults);
  const isProcessing = useExtractionStore((state) => state.isProcessing);

  // Debug current document
  useEffect(() => {
    if (currentDocument) {
      console.log("[Index] Current document changed:", {
        id: currentDocument.id,
        name: currentDocument.name,
        backendDocumentId: currentDocument.backendDocumentId,
      });
      console.log(
        "[Index] Looking up in store with key:",
        currentDocument.name,
      );
      console.log(
        "[Index] Available keys in store:",
        Object.keys(documentsByFilename),
      );
      console.log(
        "[Index] Found in store:",
        !!documentsByFilename[currentDocument.name],
      );
    }
  }, [currentDocument, documentsByFilename]);

  // Check if we have extracted data for the current document
  const hasExtractedData = currentDocument
    ? !!documentsByFilename[currentDocument.name]
    : false;
  const { name: categoryName, resetCategory } = useUserCategory();

  const [highlightedRegion, setHighlightedRegion] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    "extract" | "summary" | "tables" | "language" | "export"
  >("extract");

  const handleDocumentUpload = (document: UploadedDocument) => {
    const backendDocumentId =
      documentsByFilename[document.name]?.documentId ?? undefined;

    console.log("[Index] handleDocumentUpload called:", {
      filename: document.name,
      backendDocumentId,
      currentDocumentId,
      isProcessing,
    });

    setUploadedDocuments((prev) => {
      const exists = prev.some((doc) => doc.id === document.id);

      if (exists) {
        return prev.map((doc) =>
          doc.id === document.id ? { ...document, backendDocumentId } : doc,
        );
      }

      return [...prev, { ...document, backendDocumentId }];
    });

    // Only auto-select if:
    // 1. Not currently processing, OR
    // 2. No document is currently selected yet
    // This prevents jumping between documents during multi-file processing
    // The first document in a batch will be selected, subsequent ones just registered
    if (isProcessing && currentDocumentId !== null) {
      // During processing, if a document is already selected, don't switch
      // Just update the document list and backend IDs above
      // But DO update the current document if this is the same one getting its backend ID
      if (currentDocumentId === document.id && backendDocumentId) {
        console.log("[Index] Updating current document with backend ID");
        setCurrentBackendDocumentId(backendDocumentId);
        setCurrentDocument(
          { ...document, backendDocumentId },
          backendDocumentId,
        );
      } else {
        console.log(
          "[Index] Skipping auto-select (already have a document selected)",
        );
      }
      return;
    }

    console.log("[Index] Auto-selecting document:", document.name);
    setCurrentDocumentId(document.id);
    setCurrentBackendDocumentId(backendDocumentId ?? null);

    setCurrentDocument(
      { ...document, backendDocumentId },
      backendDocumentId ?? null,
    );
  };

  const handleDocumentSelect = (documentId: string) => {
    setCurrentDocumentId(documentId);

    const selected = uploadedDocuments.find((doc) => doc.id === documentId);

    const backendId =
      selected?.backendDocumentId ||
      (selected ? documentsByFilename[selected.name]?.documentId : null);

    setCurrentBackendDocumentId(backendId ?? null);
    setCurrentDocument(selected || null, backendId ?? null);
  };

  const handleAddDocuments = () => {
    setCurrentDocumentId(null);
    setCurrentBackendDocumentId(null);
    setCurrentDocument(null, null);
    setIsAddToCurrentSetup(true);
  };

  const handleStartNew = () => {
    setUploadedDocuments([]);
    clearResults();
    resetCategory();
    setCurrentDocumentId(null);
    setCurrentBackendDocumentId(null);
    setCurrentDocument(null, null);
    setIsAddToCurrentSetup(false);
  };

  useEffect(() => {
    if (!documentsByFilename || uploadedDocuments.length === 0) return;

    setUploadedDocuments((prev) =>
      prev.map((doc) => {
        const backendId = documentsByFilename[doc.name]?.documentId;
        if (!backendId || doc.backendDocumentId === backendId) return doc;
        return { ...doc, backendDocumentId: backendId };
      }),
    );

    if (currentDocument) {
      const backendId =
        documentsByFilename[currentDocument.name]?.documentId ?? null;

      if (backendId && backendId !== currentBackendDocumentId) {
        setCurrentBackendDocumentId(backendId);
        setCurrentDocument(currentDocument, backendId);
      }
    }
  }, [
    currentBackendDocumentId,
    currentDocument,
    documentsByFilename,
    uploadedDocuments.length,
    setCurrentDocument,
  ]);

  const handleFieldHover = (
    region: { x: number; y: number; width: number; height: number } | null,
  ) => {
    setHighlightedRegion(region);
  };

  const handleCitationClick = (
    pageNumber: number,
    region: { x: number; y: number; width: number; height: number },
  ) => {
    setHighlightedRegion(region);
  };

  const tabs = [
    { id: "extract", label: "Extracted Data" },
    { id: "summary", label: "AI Summary" },
    { id: "tables", label: "Tables" },
    { id: "language", label: "Translation" },
    { id: "export", label: "Export" },
  ] as const;

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-background via-background to-muted/30">
      <Header />

      <main
        className={cn(
          "container px-4 py-4",
          currentDocument
            ? "h-[calc(100vh-72px)] overflow-hidden"
            : "min-h-[calc(100vh-72px)] overflow-y-auto",
        )}
      >
        {/* DocumentUpload is always mounted to keep WebSocket alive during processing */}
        {/* It shows its own processing overlay when active */}
        <DocumentUpload
          onDocumentUpload={handleDocumentUpload}
          lockToCurrentCategory={
            isAddToCurrentSetup && uploadedDocuments.length > 0
          }
          hideUploadUI={!!currentDocument}
        />

        {!currentDocument && (
          <div className="h-full flex flex-col justify-center">
            {/* Add-to-setup banner when adding to current session */}
            {isAddToCurrentSetup && uploadedDocuments.length > 0 && (
              <div className="max-w-3xl mx-auto w-full mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium text-foreground">
                  Adding to current setup
                  {categoryName && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      • Category:{" "}
                      <span className="text-foreground">{categoryName}</span>
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  New files will use the same category. Only documents for this
                  category can be added here.
                </p>
              </div>
            )}

            {/* Upload Section placeholder when not processing */}
            {uploadedDocuments.length > 0 && (
              <div className="max-w-3xl mx-auto w-full">
                <div className="mt-6 p-4 rounded-xl bg-card border border-border/50">
                  <p className="text-sm text-muted-foreground mb-3">
                    Select from uploaded documents:
                  </p>
                  <Select onValueChange={handleDocumentSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a document" />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadedDocuments.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        {currentDocument && (
          <div className="flex flex-col gap-4 h-full">
            {/* Compact Document Bar */}
            <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-card border border-border/50 gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg">📄</span>

                <Select
                  value={currentDocumentId || undefined}
                  onValueChange={handleDocumentSelect}
                >
                  <SelectTrigger className="min-w-[220px] max-w-[400px] h-9 text-sm">
                    <SelectValue placeholder="Select document" />
                  </SelectTrigger>
                  <SelectContent>
                    {uploadedDocuments.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {categoryName && (
                  <span className="text-xs text-muted-foreground shrink-0 px-2 py-1 rounded-md bg-muted/60">
                    Category: {categoryName}
                  </span>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    Upload New <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleAddDocuments}>
                    Add documents (same category)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleStartNew}>
                    Start new session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-2 gap-6 h-full overflow-hidden">
              {/* Preview */}
              <div className="h-full overflow-auto">
                <DocumentPreview
                  documentName={currentDocument.name}
                  file={currentDocument.file}
                  highlightedRegion={highlightedRegion}
                  key={currentDocument.id}
                />
              </div>

              {/* Panels */}
              <div className="flex flex-col h-full overflow-hidden">
                {isProcessing || !hasExtractedData ? (
                  <div className="flex items-center justify-center h-full bg-card rounded-2xl border border-border/50">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Text is being extracted from your document...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Please wait while we process your file
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Tabs */}
                    <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() =>
                            setActiveTab(tab.id as typeof activeTab)
                          }
                          className={cn(
                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === tab.id
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content: render all panels but hide inactive so state persists when switching tabs */}
                    <div className="flex-1 overflow-auto mt-4 min-h-0">
                      <div
                        className={cn(
                          "h-full",
                          activeTab !== "extract" && "hidden",
                        )}
                      >
                        <ExtractedDataPanel
                          onFieldHover={handleFieldHover}
                          selectedFilename={currentDocument?.name || null}
                        />
                      </div>
                      <div
                        className={cn(
                          "h-full",
                          activeTab !== "summary" && "hidden",
                        )}
                      >
                        <SummaryPanel onCitationClick={handleCitationClick} />
                      </div>
                      <div
                        className={cn(
                          "h-full",
                          activeTab !== "tables" && "hidden",
                        )}
                      >
                        <TableViewer />
                      </div>
                      <div
                        className={cn(
                          "h-full",
                          activeTab !== "language" && "hidden",
                        )}
                      >
                        <MultiLanguagePanel />
                      </div>
                      <div
                        className={cn(
                          "h-full",
                          activeTab !== "export" && "hidden",
                        )}
                      >
                        <ExportPanel />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
