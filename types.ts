export interface StudyMaterial {
  rawText: string;
  markdown: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING_OCR = 'PROCESSING_OCR',
  PROCESSING_GEMINI = 'PROCESSING_GEMINI',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface ProcessingState {
  status: AppStatus;
  progress?: number; // 0-100
  message?: string;
  error?: string;
}
