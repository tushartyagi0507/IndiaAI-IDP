import { create } from "zustand";
import { UploadedDocument } from "@/types/document";

export interface ExtractionDocument {
  filename: string;
  documentId: string;
  markdown: string;
  html?: string;
  json?: Record<string, unknown>;
  pages?: unknown[];
}

interface ExtractionState {
  batchId: string | null;
  documentsByFilename: Record<string, ExtractionDocument>;
  currentDocument: UploadedDocument | null;
  document_id: string | null;
  isProcessing: boolean;
  /** Total number of files in the current batch (set on upload). */
  totalFiles: number;
  /** Number of files that have completed OCR so far. */
  completedFiles: number;
  /** Filename currently being processed on the backend. */
  processingFilename: string | null;

  /** (Legacy) Set all documents at once — still works for non-streaming callers. */
  setBatchResult: (payload: {
    batchId: string;
    documents: ExtractionDocument[];
  }) => void;

  /** Initialize a new streaming batch (called when POST /upload/ocr returns). */
  initBatch: (batchId: string, totalFiles: number) => void;

  /** Add a single completed document (called per WebSocket document_ready event). */
  addDocument: (doc: ExtractionDocument) => void;

  /** Update the filename that is currently being processed. */
  setProcessingFilename: (filename: string | null) => void;

  setCurrentDocument: (
    document: UploadedDocument | null,
    documentId: string | null,
  ) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  clearResults: () => void;
}

export const useExtractionStore = create<ExtractionState>((set) => ({
  batchId: null,
  documentsByFilename: {},
  currentDocument: null,
  document_id: null,
  isProcessing: false,
  totalFiles: 0,
  completedFiles: 0,
  processingFilename: null,

  setBatchResult: ({ batchId, documents }) =>
    set(() => ({
      batchId,
      documentsByFilename: documents.reduce<Record<string, ExtractionDocument>>(
        (acc, doc) => {
          acc[doc.filename] = doc;
          return acc;
        },
        {},
      ),
      totalFiles: documents.length,
      completedFiles: documents.length,
      processingFilename: null,
    })),

  initBatch: (batchId, totalFiles) =>
    set(() => ({
      batchId,
      totalFiles,
      completedFiles: 0,
      processingFilename: null,
      documentsByFilename: {},
    })),

  addDocument: (doc) =>
    set((state) => {
      console.log("[Store] addDocument called with:", {
        filename: doc.filename,
        hasMarkdown: !!doc.markdown,
        hasHtml: !!doc.html,
        markdownLength: doc.markdown?.length || 0,
        htmlLength: doc.html?.length || 0,
      });

      const newState = {
        documentsByFilename: {
          ...state.documentsByFilename,
          [doc.filename]: doc,
        },
        completedFiles: state.completedFiles + 1,
      };

      console.log(
        "[Store] After adding, documentsByFilename keys:",
        Object.keys(newState.documentsByFilename),
      );

      return newState;
    }),

  setProcessingFilename: (filename) =>
    set(() => ({
      processingFilename: filename,
    })),

  setCurrentDocument: (document, documentId) =>
    set(() => ({
      currentDocument: document,
      document_id: documentId,
    })),

  setIsProcessing: (isProcessing: boolean) =>
    set(() => ({
      isProcessing,
    })),

  clearResults: () =>
    set(() => ({
      batchId: null,
      documentsByFilename: {},
      currentDocument: null,
      document_id: null,
      isProcessing: false,
      totalFiles: 0,
      completedFiles: 0,
      processingFilename: null,
    })),
}));
