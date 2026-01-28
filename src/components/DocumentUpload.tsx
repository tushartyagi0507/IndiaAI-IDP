import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadedDocument } from "@/types/document";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onDocumentUpload: (document: UploadedDocument) => void;
}

const DocumentUpload = ({ onDocumentUpload }: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadedDocument[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const simulateUpload = (file: File) => {
    const doc: UploadedDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      pageCount: Math.floor(Math.random() * 20) + 1,
      status: 'uploading',
      progress: 0,
    };

    setUploadingFiles(prev => [...prev, doc]);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadingFiles(prev => prev.map(d => {
        if (d.id === doc.id) {
          const newProgress = Math.min(d.progress + Math.random() * 30, 100);
          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setUploadingFiles(prev => prev.map(d => 
                d.id === doc.id ? { ...d, status: 'processing' as const } : d
              ));
              setTimeout(() => {
                setUploadingFiles(prev => prev.map(d => 
                  d.id === doc.id ? { ...d, status: 'completed' as const } : d
                ));
                onDocumentUpload({ ...doc, status: 'completed', progress: 100 });
              }, 1500);
            }, 500);
          }
          return { ...d, progress: newProgress };
        }
        return d;
      }));
    }, 200);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(simulateUpload);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(simulateUpload);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Decorative gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-emerald/5 pointer-events-none" />
        
        <div className="relative flex flex-col items-center justify-center gap-4 py-8">
          <div className={cn(
            "p-4 rounded-2xl transition-all duration-300",
            isDragging 
              ? "bg-primary/20 scale-110" 
              : "bg-gradient-to-br from-primary/10 to-emerald/10"
          )}>
            <Upload className={cn(
              "w-12 h-12 transition-colors duration-300",
              isDragging ? "text-primary" : "text-primary/70"
            )} />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-display font-semibold">
              {isDragging ? "Drop your document here" : "Upload Document"}
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Drag and drop your PDF, Word, or image files here, or click to browse
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  multiple
                  onChange={handleFileSelect}
                />
                Browse Files
              </label>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Supported: PDF, DOC, DOCX, PNG, JPG • Max 50MB
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Uploading Files</h4>
          <div className="space-y-2">
            {uploadingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 animate-fade-in"
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  file.status === 'completed' ? "bg-emerald/10" : "bg-primary/10"
                )}>
                  <FileText className={cn(
                    "w-5 h-5",
                    file.status === 'completed' ? "text-emerald" : "text-primary"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2">
                      {file.status === 'uploading' && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(file.progress)}%
                        </span>
                      )}
                      {file.status === 'processing' && (
                        <div className="flex items-center gap-1.5 text-primary">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">Processing...</span>
                        </div>
                      )}
                      {file.status === 'completed' && (
                        <div className="flex items-center gap-1.5 text-emerald">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.pageCount} pages</span>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 opacity-50 hover:opacity-100"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
