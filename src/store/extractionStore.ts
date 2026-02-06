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
  setBatchResult: (payload: {
    batchId: string;
    documents: ExtractionDocument[];
  }) => void;
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
    })),
}));
