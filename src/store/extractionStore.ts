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
  setBatchResult: (payload: {
    batchId: string;
    documents: ExtractionDocument[];
  }) => void;
  setCurrentDocument: (
    document: UploadedDocument | null,
    documentId: string | null,
  ) => void;
  clearResults: () => void;
}

export const useExtractionStore = create<ExtractionState>((set) => ({
  batchId: null,
  documentsByFilename: {},
  currentDocument: null,
  document_id: null,
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
  clearResults: () =>
    set(() => ({
      batchId: null,
      documentsByFilename: {},
      currentDocument: null,
      document_id: null,
    })),
}));
