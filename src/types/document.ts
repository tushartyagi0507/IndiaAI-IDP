export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  pageCount: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
}

export interface ExtractedData {
  rawText: string;
  structuredData: Record<string, string | number | boolean>;
  tables: TableData[];
  language: string;
  translatedText?: string;
}

export interface TableData {
  id: string;
  headers: string[];
  rows: string[][];
}

export interface DocumentSummary {
  short: string;
  detailed: string;
  citations: Citation[];
}

export interface Citation {
  id: string;
  text: string;
  pageNumber: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type ViewMode = 'raw' | 'structured' | 'json';
export type SummaryLength = 'short' | 'detailed';
export type LanguageMode = 'original' | 'english';
export type ExportFormat = 'json' | 'csv' | 'doc';
