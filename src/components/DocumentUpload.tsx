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
import {
  useExtractionStore,
  type ExtractionDocument,
} from "@/store/extractionStore";
import useUserCategory, {
  mapSelectionToCategoryKey,
} from "@/store/userCategory";

interface DocumentUploadProps {
  onDocumentUpload: (document: UploadedDocument) => void;
  /** When true, category is fixed to the current store category (add-to-setup mode). */
  lockToCurrentCategory?: boolean;
  /** When true, hide the upload UI but keep WebSocket alive */
  hideUploadUI?: boolean;
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

const DocumentUpload = ({
  onDocumentUpload,
  lockToCurrentCategory = false,
  hideUploadUI = false,
}: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadedDocument[]>([]);
  const [category, setCategory] = useState<string | undefined>();
  const [subcategory, setSubcategory] = useState<string | undefined>();
  const [subSubcategory, setSubSubcategory] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const setProcessingInStore = useExtractionStore(
    (state) => state.setIsProcessing,
  );
  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const batchIdRef = useRef<string | null>(null);
  const initBatch = useExtractionStore((state) => state.initBatch);
  const addDocument = useExtractionStore((state) => state.addDocument);
  const setProcessingFilenameInStore = useExtractionStore(
    (state) => state.setProcessingFilename,
  );
  const processingFilename = useExtractionStore(
    (state) => state.processingFilename,
  );
  // completedFiles/totalFiles available in store for other components if needed

  const { category: storedCategoryKey, name: storedCategoryName } =
    useUserCategory();

  const { toast } = useToast();
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Reset sub-subcategory when category or subcategory changes
  useEffect(() => {
    setSubSubcategory(undefined);
  }, [category, subcategory]);

  const { setCategoryFromSelection, resetCategory } = useUserCategory();

  // Persist mapped category key to store (only when not locked to current category).
  useEffect(() => {
    if (lockToCurrentCategory) return;
    if (subSubcategory) {
      setCategoryFromSelection(subSubcategory, "subSubcategory");
      return;
    }
    if (subcategory) {
      setCategoryFromSelection(subcategory, "subcategory");
      return;
    }
    resetCategory();
  }, [
    lockToCurrentCategory,
    subcategory,
    subSubcategory,
    setCategoryFromSelection,
    resetCategory,
  ]);

  // Cleanup WebSocket and poll timer on unmount
  useEffect(() => {
    return () => {
      console.log("[WS] Component unmounting, cleaning up WebSocket");
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pollTimerRef.current !== null) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // Track if we've shown the first document yet
  const firstDocumentShownRef = useRef<boolean>(false);

  // ---------- helpers: handle a single document_ready payload ----------
  const handleDocumentReady = useCallback(
    (doc: {
      document_id: string;
      filename: string;
      num_pages?: number;
      markdown?: string;
      html?: string;
      json?: Record<string, unknown>;
      pages?: unknown[];
    }) => {
      console.log("[DocumentUpload] Document ready:", doc.filename);

      addDocument({
        filename: doc.filename,
        documentId: doc.document_id,
        markdown: doc.markdown ?? "",
        html: doc.html,
        json: doc.json,
        pages: doc.pages,
      } as ExtractionDocument);

      setUploadingFiles((prev) => {
        const updated = prev.map((f) =>
          f.name === doc.filename
            ? {
                ...f,
                status: "completed" as const,
                progress: 100,
                pageCount: doc.num_pages ?? f.pageCount,
                backendDocumentId: doc.document_id,
              }
            : f,
        );

        // Notify parent that this document is ready with backend data
        // Parent component will decide whether to auto-select it
        const completedDoc = updated.find((f) => f.name === doc.filename);
        if (completedDoc) {
          onDocumentUpload(completedDoc);
        }

        // After first document is ready, close the blocking overlay IMMEDIATELY
        // Let remaining files process in the background
        if (!firstDocumentShownRef.current) {
          firstDocumentShownRef.current = true;
          console.log(
            "[DocumentUpload] First document ready, closing overlay NOW",
          );
          // Close overlay immediately to show results
          setIsProcessing(false);
          setProcessingInStore(false);
        }

        return updated;
      });
    },
    [addDocument, onDocumentUpload, setProcessingInStore],
  );

  const finishBatch = useCallback(() => {
    console.log("[DocumentUpload] Batch complete, cleaning up");
    setProcessingFilenameInStore(null);
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    batchIdRef.current = null; // Allow new uploads

    // Clean up uploadingFiles and reset for next batch
    setTimeout(() => {
      setUploadingFiles([]);
      firstDocumentShownRef.current = false;
    }, 500);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [setProcessingFilenameInStore]);

  // ---------- polling fallback ----------
  // Polls GET /batch/{batch_id}/status every few seconds so that even if WS
  // events are missed (race condition, dropped connection, etc.), the UI
  // still discovers completed documents and the batch-complete state.
  const startPolling = useCallback(
    (batchId: string, expectedTotal: number) => {
      if (pollTimerRef.current !== null) return; // already polling
      const alreadySeen = new Set<string>();

      pollTimerRef.current = window.setInterval(async () => {
        try {
          console.log("[Polling] Fetching status for batch:", batchId);
          const res = await fetch(
            `http://localhost:8080/batch/${batchId}/status`,
          );

          if (!res.ok) {
            console.error(
              "[Polling] Status request failed:",
              res.status,
              res.statusText,
            );
            return;
          }

          const data = (await res.json()) as {
            completed_files: number;
            documents: {
              document_id: string;
              filename: string;
              num_pages?: number;
              markdown?: string;
              html?: string;
              json?: Record<string, unknown>;
              pages?: unknown[];
            }[];
          };

          console.log("[Polling] Status response:", {
            completed: data.completed_files,
            total: expectedTotal,
            documentCount: data.documents.length,
          });

          // Ingest any documents we haven't seen yet
          for (const doc of data.documents) {
            if (!alreadySeen.has(doc.document_id)) {
              alreadySeen.add(doc.document_id);
              console.log("[Polling] New document from polling:", doc.filename);
              handleDocumentReady(doc);
            }
          }

          // If all files are done, finish the batch
          if (data.completed_files >= expectedTotal) {
            console.log("[Polling] All files complete, finishing batch");
            finishBatch();
          }
        } catch (error) {
          // Ignore transient fetch errors — we'll retry on the next tick
          console.error("[Polling] Error:", error);
        }
      }, 3000);
    },
    [handleDocumentReady, finishBatch],
  );

  // ---------- WebSocket connection ----------
  const connectWebSocket = useCallback(
    (batchId: string, expectedTotal: number) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      batchIdRef.current = batchId;
      const wsUrl = `ws://localhost:8080/ws/progress/${batchId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected to batch", batchId);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WS] Received event:", data.event, data);

          switch (data.event) {
            case "processing_started":
              console.log("[WS] Processing started:", data.filename);
              setProcessingFilenameInStore(data.filename);
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.name === data.filename
                    ? { ...f, status: "processing" as const }
                    : f,
                ),
              );
              break;

            case "document_ready":
              console.log("[WS] Document ready:", data.document.filename);
              handleDocumentReady(data.document);
              break;

            case "document_failed":
              console.log("[WS] Document failed:", data.filename);
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.name === data.filename
                    ? { ...f, status: "error" as const }
                    : f,
                ),
              );
              toast({
                title: `Failed: ${data.filename}`,
                description: data.error || "Processing failed",
                variant: "destructive",
              });
              break;

            case "batch_complete":
              console.log("[WS] Batch complete");
              finishBatch();
              break;
          }
        } catch (err) {
          console.error("WS message parse error:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = (event) => {
        console.log("[WS] Connection closed:", event.code, event.reason);
      };

      // Start the polling fallback alongside WebSocket.
      // If WS delivers everything, polling will just see the same docs and
      // stop when completed_files >= expectedTotal. If WS misses events,
      // polling will pick them up.
      startPolling(batchId, expectedTotal);
    },
    [
      handleDocumentReady,
      finishBatch,
      setProcessingFilenameInStore,
      startPolling,
      toast,
    ],
  );

  const uploadToBackend = useCallback(
    async (files: File[]) => {
      if (batchIdRef.current) {
        return;
      }

      const effectiveCategoryKey = lockToCurrentCategory
        ? storedCategoryKey
        : subSubcategory &&
            hasSubSubcategories(category ?? "", subcategory ?? "")
          ? mapSelectionToCategoryKey(subSubcategory, "subSubcategory")
          : subcategory
            ? mapSelectionToCategoryKey(subcategory, "subcategory")
            : null;

      if (!effectiveCategoryKey) {
        setIsProcessing(false);
        setProcessingInStore(false);
        toast({
          title: lockToCurrentCategory
            ? "No category set"
            : "Select category first",
          description: lockToCurrentCategory
            ? "Start a new session and upload a document to set a category first."
            : "Please choose a category and subcategory before uploading files.",
          variant: "destructive",
        });
        return;
      }

      if (!lockToCurrentCategory && (!category || !subcategory)) {
        setIsProcessing(false);
        setProcessingInStore(false);
        return;
      }

      if (!lockToCurrentCategory) {
        const requiresSubSubcategory = hasSubSubcategories(
          category!,
          subcategory!,
        );
        if (requiresSubSubcategory && !subSubcategory) {
          setIsProcessing(false);
          setProcessingInStore(false);
          toast({
            title: "Select sub-subcategory",
            description:
              "Please choose a sub-subcategory before uploading files.",
            variant: "destructive",
          });
          return;
        }
      }

      const formData = new FormData();

      formData.append("category", effectiveCategoryKey);
      files.forEach((file) => {
        formData.append("files", file);
      });

      try {
        console.log(
          "[DocumentUpload] Starting upload for",
          files.length,
          "files",
        );
        const uploadStartTime = Date.now();

        // POST returns immediately — background task handles OCR
        const response = await fetch("http://localhost:8080/upload/ocr", {
          method: "POST",
          body: formData,
        });

        const uploadDuration = Date.now() - uploadStartTime;
        console.log(
          "[DocumentUpload] Upload POST completed in",
          uploadDuration,
          "ms",
        );

        if (!response.ok) {
          console.error(
            "[DocumentUpload] Upload failed:",
            response.status,
            response.statusText,
          );
          setIsProcessing(false);
          setProcessingInStore(false);
          throw new Error("Upload failed");
        }

        const payload = (await response.json()) as {
          batch_id: string;
          total_files?: number;
          filenames?: string[];
          documents?: {
            document_id: string;
            filename: string;
            num_pages?: number;
            markdown?: string;
            html?: string;
            json?: Record<string, unknown>;
            pages?: unknown[];
          }[];
        };

        console.log("[DocumentUpload] Received batch_id:", payload.batch_id);

        if (!payload?.batch_id) {
          setIsProcessing(false);
          setProcessingInStore(false);
          return;
        }

        const totalFiles =
          payload.total_files ??
          payload.documents?.length ??
          files.length;

        // Initialize batch in the store (streaming mode)
        initBatch(payload.batch_id, totalFiles);

        // If the upload response already contains documents (synchronous mode),
        // ingest them immediately so layout_blocks are available right away.
        if (payload.documents && payload.documents.length > 0) {
          console.log(
            "[DocumentUpload] Upload response contains",
            payload.documents.length,
            "documents — ingesting directly",
          );
          for (const doc of payload.documents) {
            handleDocumentReady(doc);
          }
          finishBatch();
        } else {
          // Connect to WebSocket + start polling fallback
          connectWebSocket(payload.batch_id, totalFiles);
        }
      } catch (error) {
        console.error("[DocumentUpload] Upload error:", error);
        setIsProcessing(false);
        setProcessingInStore(false);
        toast({
          title: "Upload failed",
          description:
            "There was a problem uploading your files. Please try again.",
          variant: "destructive",
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      category,
      connectWebSocket,
      initBatch,
      lockToCurrentCategory,
      storedCategoryKey,
      subcategory,
      subSubcategory,
      toast,
    ],
  );

  const simulateUpload = useCallback(
    (file: File) => {
      // Compute effective category key directly (same logic as uploadToBackend)
      // to avoid any timing mismatch with the Zustand store value.
      const effectiveCategory = lockToCurrentCategory
        ? storedCategoryKey
        : subSubcategory &&
            hasSubSubcategories(category ?? "", subcategory ?? "")
          ? mapSelectionToCategoryKey(subSubcategory, "subSubcategory")
          : subcategory
            ? mapSelectionToCategoryKey(subcategory, "subcategory")
            : storedCategoryKey;

      const doc: UploadedDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        pageCount: 0, // Will be updated from WS document_ready
        status: "uploading",
        progress: 0,
        category: effectiveCategory || storedCategoryKey,
        subcategory: lockToCurrentCategory ? storedCategoryName : subcategory,
        subSubcategory: lockToCurrentCategory ? undefined : subSubcategory,
        file: file,
      };

      setUploadingFiles((prev) => [...prev, doc]);

      // Quick upload progress animation (POST returns fast with the new architecture)
      const interval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((d) => {
            if (d.id === doc.id && d.status === "uploading") {
              const newProgress = Math.min(
                d.progress + Math.random() * 40,
                100,
              );
              if (newProgress >= 100) {
                clearInterval(interval);
                // Transition to "processing" — file is now in the backend OCR queue.
                // The WebSocket document_ready event will transition it to "completed".
                setTimeout(() => {
                  setUploadingFiles((prev) =>
                    prev.map((d) =>
                      d.id === doc.id
                        ? { ...d, status: "processing" as const, progress: 100 }
                        : d,
                    ),
                  );
                  // Register the document in Index.tsx so it appears in the selector
                  onDocumentUpload({
                    ...doc,
                    status: "processing",
                    progress: 100,
                    file: file,
                  });
                }, 300);
              }
              return { ...d, progress: newProgress };
            }
            return d;
          }),
        );
      }, 150);
    },
    [
      category,
      lockToCurrentCategory,
      onDocumentUpload,
      storedCategoryKey,
      storedCategoryName,
      subcategory,
      subSubcategory,
    ],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (lockToCurrentCategory) {
        if (!storedCategoryKey) return;
      } else if (!category || !subcategory) {
        return;
      }
      const files = Array.from(e.dataTransfer.files);
      setIsProcessing(true);
      setProcessingInStore(true);
      uploadToBackend(files);
      files.forEach(simulateUpload);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      category,
      lockToCurrentCategory,
      simulateUpload,
      storedCategoryKey,
      subcategory,
      uploadToBackend,
    ],
  );
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (lockToCurrentCategory) {
      if (!storedCategoryKey) {
        toast({
          title: "No category set",
          description:
            "Start a new session and upload a document to set a category first.",
          variant: "destructive",
        });
        return;
      }
    } else if (!category || !subcategory) {
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
    setProcessingInStore(true);
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

  return (
    <>
      {/* Processing overlay - only shows while FIRST file is being processed */}
      {isProcessing && uploadingFiles.length > 0 && (
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
                  First file's results will appear as soon as it's ready
                </p>
              </div>
            </div>

            {/* Real-time processing progress */}
            {isProcessing && uploadingFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Processing Progress</span>
                  <span>
                    {
                      uploadingFiles.filter((f) => f.status === "completed")
                        .length
                    }{" "}
                    of {uploadingFiles.length} file
                    {uploadingFiles.length > 1 ? "s" : ""} completed
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald transition-all duration-500 ease-out"
                    style={{
                      width: `${uploadingFiles.length > 0 ? (uploadingFiles.filter((f) => f.status === "completed").length / uploadingFiles.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                {processingFilename && (
                  <p className="text-xs text-muted-foreground">
                    Currently processing:{" "}
                    <span className="font-medium text-foreground">
                      {processingFilename}
                    </span>
                  </p>
                )}
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
                            {file.status === "error" && (
                              <div className="flex items-center gap-1.5 text-destructive">
                                <X className="w-4 h-4" />
                                <span className="text-xs">Failed</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          {/* <span>{file.pageCount} pages</span> */}
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

      {/* Background progress indicator for remaining files */}
      {!isProcessing &&
        uploadingFiles.length > 0 &&
        uploadingFiles.some((f) => f.status === "processing") && (
          <div className="fixed bottom-4 right-4 z-40 bg-card border border-border/60 shadow-lg rounded-lg p-4 max-w-sm">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Background Processing</p>
                <p className="text-xs text-muted-foreground">
                  {
                    uploadingFiles.filter((f) => f.status === "completed")
                      .length
                  }{" "}
                  of {uploadingFiles.length} files complete
                </p>
              </div>
            </div>
          </div>
        )}

      <div className="space-y-4">
        {/* Hero + Upload + Features - hidden when overlay is showing or when hideUploadUI is true */}
        {!isProcessing && !hideUploadUI && (
          <>
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto mb-10 text-center animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-display font-bold mb-4 leading-tight">
                Transform Documents with
                <span className="block gradient-text">
                  India AI Intelligence
                </span>
              </h1>
              <p className="text-md text-muted-foreground max-w-2xl mx-auto mb-6">
                Extract, analyze, and summarize documents in multiple languages.
                Experience the power of AI-driven document processing made in
                India.
              </p>
            </div>

            {/* Upload Zone - scroll target for "Back to upload" */}
            <div
              id="upload-zone"
              className={cn(
                "relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8 scroll-mt-24",
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

              {/* Category Selector: locked (add mode) or editable (new session) */}
              <div className="relative mb-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-4">
                {lockToCurrentCategory ? (
                  <div className="space-y-2">
                    <Label>Category (fixed for this session)</Label>
                    {storedCategoryKey ? (
                      <p className="text-sm font-medium text-foreground py-2 px-3 rounded-lg bg-muted/60">
                        {storedCategoryName || storedCategoryKey}
                      </p>
                    ) : (
                      <p className="text-sm text-destructive py-2">
                        No category set. Start a new session to choose a
                        category.
                      </p>
                    )}
                  </div>
                ) : (
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
                )}
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
                    {lockToCurrentCategory && storedCategoryKey
                      ? "Drag and drop or browse to add more documents for the same category."
                      : "Drag and drop your PDF or image files here, or click to browse. Choose category and subcategory first."}
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

            {/* Features Section */}
            <div
              id="features"
              className="max-w-5xl mx-auto mt-16 mb-8 animate-slide-up scroll-mt-24"
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
              <div className="mt-10 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    document
                      .getElementById("upload-zone")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <Upload className="w-4 h-4" />
                  Back to upload
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DocumentUpload;
