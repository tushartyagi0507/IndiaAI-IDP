import { useState, useEffect, useRef, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sun,
  Moon,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set up pdf.js worker using local library
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface DocumentPreviewProps {
  documentName?: string;
  file?: File;
  highlightedRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

const DocumentPreview = ({
  documentName,
  file,
  highlightedRegion,
}: DocumentPreviewProps) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkBg, setIsDarkBg] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Memoize file type detection to update when file changes
  const isImage = useMemo(() => {
    if (!file) return false;
    return (
      file.type?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name)
    );
  }, [file]);

  const isPdf = useMemo(() => {
    if (!file) return false;
    return (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    );
  }, [file]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Debug: Log file info
  useEffect(() => {
    if (file) {
      console.log("DocumentPreview - File received:", {
        name: file.name,
        type: file.type,
        size: file.size,
        isPdf,
        isImage,
      });
    } else {
      console.log("DocumentPreview - No file provided");
    }
  }, [file, isPdf, isImage]);

  // Load PDF document
  useEffect(() => {
    if (!file || !isPdf) {
      setPdfDoc(null);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        console.log("Loading PDF, arrayBuffer size:", arrayBuffer.byteLength);
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        console.log("PDF loaded successfully, pages:", pdf.numPages);
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error loading PDF:", error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    fileReader.onerror = (error) => {
      console.error("FileReader error:", error);
      setIsLoading(false);
    };
    fileReader.readAsArrayBuffer(file);
  }, [file, isPdf]);

  // Render PDF page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !isPdf) return;

    const renderPage = async () => {
      try {
        setIsLoading(true);
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const viewport = page.getViewport({ scale: 1.0 });
        const scale = zoom / 100;
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error("Error rendering PDF page:", error);
      } finally {
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, zoom, isPdf]);

  // Load image
  useEffect(() => {
    if (!file || !isImage) {
      setImageUrl(null);
      return;
    }

    console.log("Loading image:", file.name);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setTotalPages(1);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, isImage]);

  return (
    <div className="flex h-full bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Thumbnails Sidebar */}
      {showThumbnails && isPdf && pdfDoc && totalPages > 1 && (
        <div className="w-24 border-r border-border/50 bg-muted/30 p-2 overflow-y-auto scrollbar-thin">
          <div className="space-y-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-full aspect-[3/4] rounded-lg border-2 transition-all duration-200 bg-background flex items-center justify-center overflow-hidden",
                  currentPage === i + 1
                    ? "border-primary shadow-md"
                    : "border-transparent hover:border-primary/30",
                )}
              >
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground/50" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-14 text-center">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="ghost" size="icon" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || !isPdf || totalPages <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {isPdf
                ? `Page ${currentPage} of ${totalPages}`
                : isImage
                  ? "Image"
                  : "Document"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || !isPdf || totalPages <= 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkBg(!isDarkBg)}
            >
              {isDarkBg ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowThumbnails(!showThumbnails)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Document View */}
        <div
          className={cn(
            "flex-1 overflow-auto p-6 flex items-start justify-center transition-colors duration-300",
            isDarkBg ? "bg-secondary" : "bg-muted/30 pattern-dots",
          )}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!file && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-sm">No document selected</p>
            </div>
          )}

          {file && !isLoading && (
            <div className="relative bg-card shadow-xl rounded-lg overflow-hidden transition-transform duration-300">
              {isPdf && pdfDoc ? (
                <div
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: "top center",
                  }}
                >
                  <canvas ref={canvasRef} className="block" />
                </div>
              ) : isPdf && !pdfDoc ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm">Loading PDF...</p>
                </div>
              ) : null}

              {isImage && imageUrl ? (
                <div
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: "top center",
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={documentName || "Document preview"}
                    className="max-w-full h-auto block"
                    onError={(e) => {
                      console.error("Image load error:", e);
                    }}
                    onLoad={() => {
                      console.log("Image loaded successfully");
                    }}
                  />
                </div>
              ) : isImage && !imageUrl ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm">Loading image...</p>
                </div>
              ) : null}

              {!isPdf && !isImage && file && (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-sm">Unsupported file type</p>
                  <p className="text-xs mt-2">File: {file.name}</p>
                  <p className="text-xs">Type: {file.type || "unknown"}</p>
                </div>
              )}

              {/* Highlighted Region */}
              {highlightedRegion && (
                <div
                  className="absolute border-2 border-primary bg-primary/10 rounded transition-all duration-300 pointer-events-none z-10"
                  style={{
                    left: `${highlightedRegion.x}%`,
                    top: `${highlightedRegion.y}%`,
                    width: `${highlightedRegion.width}%`,
                    height: `${highlightedRegion.height}%`,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
