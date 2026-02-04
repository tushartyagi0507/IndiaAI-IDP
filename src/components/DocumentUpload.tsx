import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, FileText, X, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadedDocument } from "@/types/document";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useExtractionStore } from "@/store/extractionStore";

interface DocumentUploadProps {
  onDocumentUpload: (document: UploadedDocument) => void;
}

// Category structure: subcategory can be a string or an object with subSubcategories array
const CATEGORY_OPTIONS: Record<
  string,
  (string | { name: string; subSubcategories?: string[] })[]
> = {
  "PD Branch": ["Apar"],
  "SOAP-NIC": [
    {
      name: "Community_cetificates",
      subSubcategories: ["EWS", "OBC", "SC", "ST"],
    },
    "Disability_cetificates",
    "Matriculations",
    "Name Change",
    "Photo ID",
    "Writing_extemity",
  ],
  "ORA-Cell": [
    "age_relaxation",
    "dob",
    "educaiton",
    "experience",
    "obc",
    "professional_registration",
    "sc",
    "st",
  ],
  "Disciplinary Cases": [
    "Brief Background",
    "CO Brief",
    "IO Report",
    "PO Brief",
  ],
};

// Helper functions to work with category structure
const getSubcategories = (cat: string): string[] => {
  const options = CATEGORY_OPTIONS[cat] || [];
  return options.map((opt) => (typeof opt === "string" ? opt : opt.name));
};

const getSubSubcategories = (
  cat: string,
  subcat: string,
): string[] | undefined => {
  const options = CATEGORY_OPTIONS[cat] || [];
  const subcatOption = options.find(
    (opt) => (typeof opt === "object" ? opt.name : opt) === subcat,
  );
  return typeof subcatOption === "object"
    ? subcatOption.subSubcategories
    : undefined;
};

const hasSubSubcategories = (cat: string, subcat: string): boolean => {
  return getSubSubcategories(cat, subcat) !== undefined;
};

const DocumentUpload = ({ onDocumentUpload }: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadedDocument[]>([]);
  const [category, setCategory] = useState<string | undefined>();
  const [subcategory, setSubcategory] = useState<string | undefined>();
  const [subSubcategory, setSubSubcategory] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const processingIntervalRef = useRef<number | null>(null);
  const setBatchResult = useExtractionStore((state) => state.setBatchResult);

  const { toast } = useToast();
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Editable multi-step processing flow shown while waiting for API
  const PROCESS_STEPS: string[] = [
    "Uploading document to server",
    "Classifying by category and subcategory",
    "Running AI-powered extraction",
    "Preparing structured outputs",
  ];

  // Reset sub-subcategory when category or subcategory changes
  useEffect(() => {
    setSubSubcategory(undefined);
  }, [category, subcategory]);

  // Cycle through processing steps while API call is in progress
  useEffect(() => {
    if (!isProcessing) {
      if (processingIntervalRef.current !== null) {
        window.clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      return;
    }

    setCurrentStep(0);
    processingIntervalRef.current = window.setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % PROCESS_STEPS.length);
    }, 1600);

    return () => {
      if (processingIntervalRef.current !== null) {
        window.clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    };
  }, [isProcessing, PROCESS_STEPS.length]);

  const uploadToBackend = useCallback(
    async (files: File[]) => {
      if (!category || !subcategory) {
        setIsProcessing(false);
        return;
      }

      // Check if sub-subcategory is required
      const requiresSubSubcategory = hasSubSubcategories(category, subcategory);
      if (requiresSubSubcategory && !subSubcategory) {
        setIsProcessing(false);
        toast({
          title: "Select sub-subcategory",
          description:
            "Please choose a sub-subcategory before uploading files.",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      if (subSubcategory) {
        formData.append("subSubcategory", subSubcategory);
      } else {
        formData.append("category", subcategory);
      }
      files.forEach((file) => {
        formData.append("files", file);
      });

      try {
        // API call fires immediately - processing state already set before this function is called
        const response = await fetch("http://localhost:8003/upload/ocr", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          setIsProcessing(false);
          throw new Error("Upload failed");
        }

        const payload = (await response.json()) as {
          batch_id?: string;
          documents?: {
            filename: string;
            document_id: string;
            markdown?: string;
            html?: string;
            json?: Record<string, unknown>;
            pages?: unknown[];
          }[];
        };
        if (payload?.batch_id && Array.isArray(payload?.documents)) {
          setBatchResult({
            batchId: payload.batch_id,
            documents: payload.documents.map((doc) => ({
              filename: doc.filename,
              documentId: doc.document_id,
              markdown: doc.markdown ?? "",
              html: doc.html,
              json: doc.json,
              pages: doc.pages,
            })),
          });
          // Set processing to false after successful response
          setTimeout(() => {
            setIsProcessing(false);
          }, 600);
        } else {
          setIsProcessing(false);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setIsProcessing(false);
        toast({
          title: "Upload failed",
          description:
            "There was a problem uploading your files. Please try again.",
          variant: "destructive",
        });
      }
    },
    [category, setBatchResult, subcategory, subSubcategory, toast],
  );

  const simulateUpload = useCallback(
    (file: File) => {
      const doc: UploadedDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        pageCount: Math.floor(Math.random() * 20) + 1,
        status: "uploading",
        progress: 0,
        category,
        subcategory,
        subSubcategory,
        file: file, // Store file object for preview
      };

      setUploadingFiles((prev) => [...prev, doc]);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((d) => {
            if (d.id === doc.id) {
              const newProgress = Math.min(
                d.progress + Math.random() * 30,
                100,
              );
              if (newProgress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                  setUploadingFiles((prev) =>
                    prev.map((d) =>
                      d.id === doc.id
                        ? { ...d, status: "processing" as const }
                        : d,
                    ),
                  );
                  setTimeout(() => {
                    setUploadingFiles((prev) =>
                      prev.map((d) =>
                        d.id === doc.id
                          ? { ...d, status: "completed" as const }
                          : d,
                      ),
                    );
                    onDocumentUpload({
                      ...doc,
                      status: "completed",
                      progress: 100,
                      file: file, // Ensure file is included
                    });
                  }, 1500);
                }, 500);
              }
              return { ...d, progress: newProgress };
            }
            return d;
          }),
        );
      }, 200);
    },
    [category, onDocumentUpload, subcategory, subSubcategory],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!category || !subcategory) {
        return;
      }
      const files = Array.from(e.dataTransfer.files);
      // Start API call immediately - don't wait for progress simulation
      setIsProcessing(true);
      uploadToBackend(files);
      // Start progress simulation in parallel
      files.forEach(simulateUpload);
    },
    [category, subcategory, simulateUpload, uploadToBackend],
  );
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (!category || !subcategory) {
      toast({
        title: "Select category first",
        description:
          "Please choose a category and subcategory before uploading files.",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ["pdf", "jpg", "jpeg", "png"];
    const files = Array.from(e.target.files);

    const hasInvalidFile = files.some((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      return !ext || !allowedTypes.includes(ext);
    });

    if (hasInvalidFile) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, JPG, JPEG, and PNG files are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Start API call immediately - don't wait for progress simulation
    setIsProcessing(true);
    uploadToBackend(files);
    // Start progress simulation in parallel
    files.forEach(simulateUpload);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const removeFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <>
      {/* Centered multi-step processing overlay with file progress - ONLY place progress is shown */}
      {(isProcessing || uploadingFiles.length > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border/60 shadow-xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Processing your documents
                </p>
                <p className="text-xs text-muted-foreground/80">
                  This may take a few moments. Please do not close the window.
                </p>
              </div>
            </div>

            {/* Multi-step loader */}
            {isProcessing && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Processing Steps
                </p>
                {PROCESS_STEPS.map((step, index) => {
                  const isDone = index < currentStep;
                  const isActive = index === currentStep;

                  return (
                    <div
                      key={step}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition-all",
                        isActive && "border-primary/60 bg-primary/5",
                        isDone && "border-emerald/60 bg-emerald/5",
                      )}
                    >
                      <div className="h-5 w-5 rounded-full flex items-center justify-center border border-border/60 bg-background shrink-0">
                        {isDone ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald" />
                        ) : isActive ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                        )}
                      </div>
                      <p
                        className={cn(
                          "flex-1",
                          isActive && "font-medium text-foreground",
                          isDone && "text-emerald-foreground",
                        )}
                      >
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* File upload progress bars - ONLY progress bars shown */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Upload Progress ({uploadingFiles.length} file
                  {uploadingFiles.length > 1 ? "s" : ""})
                </p>
                <div className="space-y-2">
                  {uploadingFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 animate-fade-in"
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0",
                          file.status === "completed"
                            ? "bg-emerald/10"
                            : "bg-primary/10",
                        )}
                      >
                        <FileText
                          className={cn(
                            "w-5 h-5",
                            file.status === "completed"
                              ? "text-emerald"
                              : "text-primary",
                          )}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {file.status === "uploading" && (
                              <span className="text-xs text-muted-foreground font-medium">
                                {Math.round(file.progress)}%
                              </span>
                            )}
                            {file.status === "processing" && (
                              <div className="flex items-center gap-1.5 text-primary">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-xs">Processing...</span>
                              </div>
                            )}
                            {file.status === "completed" && (
                              <div className="flex items-center gap-1.5 text-emerald">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">Ready</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{file.pageCount} pages</span>
                        </div>

                        {file.status === "uploading" && (
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Upload Zone - hidden when overlay is showing */}
        {!(isProcessing || uploadingFiles.length > 0) && (
          <div
            className={cn(
              "relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-muted/30",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Decorative gradient */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-emerald/5 pointer-events-none" />

            {/* Category Selector (kept inside upload card to avoid extra scrolling) */}
            <div className="relative mb-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-4">
              <div
                className={cn(
                  "grid gap-4",
                  category &&
                    subcategory &&
                    hasSubSubcategories(category, subcategory)
                    ? "md:grid-cols-3"
                    : "md:grid-cols-2",
                )}
              >
                <div className="space-y-2">
                  <Label htmlFor="document-category">Category</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value);
                      setSubcategory(undefined);
                    }}
                  >
                    <SelectTrigger
                      id="document-category"
                      className="bg-background/70"
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CATEGORY_OPTIONS).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-subcategory">Subcategory</Label>
                  <Select
                    value={subcategory}
                    onValueChange={setSubcategory}
                    disabled={!category}
                  >
                    <SelectTrigger
                      id="document-subcategory"
                      className={cn(
                        "bg-background/70",
                        !category && "opacity-70 cursor-not-allowed",
                      )}
                    >
                      <SelectValue
                        placeholder={
                          category
                            ? "Select a subcategory"
                            : "Select a category first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {category &&
                        getSubcategories(category).map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sub-subcategory - only shown when subcategory has sub-subcategories */}
                {category &&
                  subcategory &&
                  hasSubSubcategories(category, subcategory) && (
                    <div className="space-y-2">
                      <Label htmlFor="document-sub-subcategory">
                        Sub-subcategory
                      </Label>
                      <Select
                        value={subSubcategory}
                        onValueChange={setSubSubcategory}
                        disabled={!subcategory}
                      >
                        <SelectTrigger
                          id="document-sub-subcategory"
                          className={cn(
                            "bg-background/70",
                            !subcategory && "opacity-70 cursor-not-allowed",
                          )}
                        >
                          <SelectValue
                            placeholder={
                              subcategory
                                ? "Select a sub-subcategory"
                                : "Select a subcategory first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubSubcategories(category, subcategory)?.map(
                            (subSub) => (
                              <SelectItem key={subSub} value={subSub}>
                                {subSub}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
              </div>
            </div>

            <div className="relative flex flex-col items-center justify-center gap-4 py-4">
              <div
                className={cn(
                  "p-4 rounded-2xl transition-all duration-300",
                  isDragging
                    ? "bg-primary/20 scale-110"
                    : "bg-gradient-to-br from-primary/10 to-emerald/10",
                )}
              >
                <Upload
                  className={cn(
                    "w-12 h-12 transition-colors duration-300",
                    isDragging ? "text-primary" : "text-primary/70",
                  )}
                />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-display font-semibold">
                  {isDragging ? "Drop your document here" : "Upload Document"}
                </h3>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Drag and drop your PDF or image files here, or click to
                  browse. Choose category and subcategory first.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="hero" size="lg" asChild>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      multiple
                      onChange={handleFileSelect}
                    />
                    Browse Files
                  </label>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Supported: PDF, PNG, JPG, JPEG
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DocumentUpload;
