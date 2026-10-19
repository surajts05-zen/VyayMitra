export interface OcrField<T> {
  value: T;
  confidence: number; // 0.0 to 1.0
  source: 'extracted' | 'inferred';
}

export interface OcrResult {
  provider: string;
  overallConfidence: number;
  merchant?: OcrField<string>;
  date?: OcrField<string>;
  amount?: OcrField<string>;
  currency?: OcrField<string>;
  invoiceNumber?: OcrField<string>;
  taxAmount?: OcrField<string>;
  gstin?: OcrField<string>;
  rawResponse: Record<string, unknown>;
}

export interface OcrProvider {
  readonly name: string;
  extractFromReceipt(receiptId: string, fileBuffer: Buffer, mimeType: string): Promise<OcrResult>;
}
