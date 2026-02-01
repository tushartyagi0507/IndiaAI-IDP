import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  // Track all uploaded documents
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]);
  // Track the currently selected document
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    null,
  );

  // Get the current document from the array
  const currentDocument =
    uploadedDocuments.find((doc) => doc.id === currentDocumentId) || null;
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
    setUploadedDocuments((prev) => {
      // Check if document already exists (by id)
      const exists = prev.some((doc) => doc.id === document.id);
      if (exists) {
        // Update existing document
        return prev.map((doc) => (doc.id === document.id ? document : doc));
      }
      // Add new document
      return [...prev, document];
    });
    // Set as current document
    setCurrentDocumentId(document.id);
  };

  const handleDocumentSelect = (documentId: string) => {
    setCurrentDocumentId(documentId);
  };

  const handleUploadNew = () => {
    // Keep existing documents but go back to upload view
    setCurrentDocumentId(null);
  };

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
    // In a real app, this would also navigate to the page
  };

  const tabs = [
    { id: "extract", label: "Extracted Data" },
    { id: "summary", label: "AI Summary" },
    // { id: "tables", label: "Tables" },
    { id: "language", label: "Translation" },
    { id: "export", label: "Export" },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />

      <main className="container px-4 py-8">
        {/* Hero Section - Visible when no document selected */}
        {!currentDocument && (
          <div className="max-w-4xl mx-auto mb-12 text-center animate-fade-in">
            {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Powered by AI
            </div> */}
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-display font-bold mb-4 leading-tight">
              Transform Documents with
              <span className="block gradient-text">India AI Intelligence</span>
            </h1>
            <p className="text-md text-muted-foreground max-w-2xl mx-auto mb-8">
              Extract, analyze, and summarize documents in multiple languages.
              Experience the power of AI-driven document processing made in
              India.
            </p>
          </div>
        )}

        {/* Upload Section */}
        {!currentDocument && (
          <div
            className="max-w-3xl mx-auto animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <DocumentUpload onDocumentUpload={handleDocumentUpload} />

            {/* Show dropdown of previously uploaded files */}
            {uploadedDocuments.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-card border border-border/50">
                <p className="text-sm text-muted-foreground mb-3">
                  Or select from previously uploaded documents:
                </p>
                <Select onValueChange={handleDocumentSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent>
                    {uploadedDocuments.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        <div className="flex items-center gap-2">
                          <span>📄</span>
                          <span>{doc.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({doc.pageCount} pages)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Document Processing View */}
        {currentDocument && (
          <div className="space-y-6 animate-fade-in">
            {/* Document Info Bar with Dropdown */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-emerald/20 flex items-center justify-center">
                  <span className="text-xl">📄</span>
                </div>
                <div className="flex-1">
                  {/* Dropdown for selecting uploaded documents - always visible */}
                  <Select
                    value={currentDocumentId || undefined}
                    onValueChange={handleDocumentSelect}
                  >
                    <SelectTrigger className="w-auto min-w-[250px] max-w-[400px] border border-border/50 bg-muted/30 h-auto font-semibold text-foreground hover:bg-muted/50 rounded-lg px-3 py-2">
                      <SelectValue placeholder="Select a document" />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadedDocuments.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <div className="flex items-center gap-2">
                            <span>📄</span>
                            <span>{doc.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentDocument.pageCount} pages • Processed successfully
                    {uploadedDocuments.length > 1 && (
                      <span className="ml-2">
                        • {uploadedDocuments.length} files uploaded
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleUploadNew}
                className="text-sm text-primary hover:underline"
              >
                Upload New Document
              </button>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left - Document Preview */}
              <div className="lg:sticky lg:top-24 h-[calc(100vh-200px)]">
                <DocumentPreview
                  documentName={currentDocument.name}
                  highlightedRegion={highlightedRegion}
                />
              </div>

              {/* Right - Data Panels */}
              <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                        activeTab === tab.id
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[500px]">
                  {activeTab === "extract" && (
                    <ExtractedDataPanel onFieldHover={handleFieldHover} />
                  )}
                  {activeTab === "summary" && (
                    <SummaryPanel onCitationClick={handleCitationClick} />
                  )}
                  {activeTab === "tables" && <TableViewer />}
                  {activeTab === "language" && <MultiLanguagePanel />}
                  {activeTab === "export" && <ExportPanel />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid - Visible when no document selected */}
        {!currentDocument && (
          <div
            id="features"
            className="max-w-5xl mx-auto mt-20 animate-slide-up scroll-mt-24"
            style={{ animationDelay: "0.4s" }}
          >
            <h2 className="text-2xl font-display font-bold text-center mb-8">
              Powerful Features
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "🔍",
                  title: "Smart Extraction",
                  desc: "Extract text, tables, and structured data automatically",
                },
                {
                  icon: "🌐",
                  title: "Multi-Language",
                  desc: "Support for Hindi, English, and 50+ languages",
                },
                {
                  icon: "✨",
                  title: "AI Summaries",
                  desc: "Generate cited summaries with one click",
                },
                {
                  icon: "📊",
                  title: "Table Detection",
                  desc: "Identify and export tables as spreadsheets",
                },
                {
                  icon: "🔗",
                  title: "Smart Linking",
                  desc: "Click on summaries to see source regions",
                },
                {
                  icon: "📥",
                  title: "Flexible Export",
                  desc: "Download as JSON, CSV, or Word documents",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  <span className="text-3xl mb-4 block">{feature.icon}</span>
                  <h3 className="font-display font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>
            @2026 India AI Developed by{" "}
            <a
              href="https://www.neuralix.ai"
              className="text-primary hover:underline"
            >
              Neuralix
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
