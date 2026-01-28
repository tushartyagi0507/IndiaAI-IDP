import { useState } from "react";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Sun,
  Moon,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentPreviewProps {
  documentName?: string;
  highlightedRegion?: { x: number; y: number; width: number; height: number } | null;
}

const DocumentPreview = ({ documentName, highlightedRegion }: DocumentPreviewProps) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkBg, setIsDarkBg] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const totalPages = 12;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className="flex h-full bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Thumbnails Sidebar */}
      {showThumbnails && (
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
                    : "border-transparent hover:border-primary/30"
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
            <span className="text-sm font-medium w-14 text-center">{zoom}%</span>
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
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
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
              {isDarkBg ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
            isDarkBg ? "bg-secondary" : "bg-muted/30 pattern-dots"
          )}
        >
          <div
            className="relative bg-card shadow-xl rounded-lg overflow-hidden transition-transform duration-300"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
            }}
          >
            {/* Simulated Document Content */}
            <div className="w-[595px] min-h-[842px] p-12 space-y-6">
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-gradient-to-r from-navy/20 to-navy/10 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
              
              <div className="space-y-3 pt-6">
                {Array.from({ length: 8 }, (_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-3 rounded",
                      i % 3 === 0 ? "w-full bg-muted/80" : i % 3 === 1 ? "w-5/6 bg-muted/60" : "w-4/5 bg-muted/40"
                    )}
                  />
                ))}
              </div>

              {/* Highlighted Region */}
              {highlightedRegion && (
                <div
                  className="absolute border-2 border-primary bg-primary/10 rounded transition-all duration-300"
                  style={{
                    left: `${highlightedRegion.x}%`,
                    top: `${highlightedRegion.y}%`,
                    width: `${highlightedRegion.width}%`,
                    height: `${highlightedRegion.height}%`,
                  }}
                />
              )}

              {/* Table Simulation */}
              <div className="mt-8 border border-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 bg-muted/50">
                  {['Header 1', 'Header 2', 'Header 3', 'Header 4'].map((h, i) => (
                    <div key={i} className="p-3 text-xs font-medium text-muted-foreground border-r last:border-r-0">
                      {h}
                    </div>
                  ))}
                </div>
                {Array.from({ length: 4 }, (_, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-4 border-t border-border">
                    {Array.from({ length: 4 }, (_, colIdx) => (
                      <div key={colIdx} className="p-3 text-xs text-muted-foreground border-r last:border-r-0">
                        Data {rowIdx + 1}.{colIdx + 1}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6">
                {Array.from({ length: 5 }, (_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-3 rounded",
                      i % 2 === 0 ? "w-full bg-muted/60" : "w-11/12 bg-muted/40"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
