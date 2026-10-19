import { OcrProvider, OcrResult } from './ocr-interface.js';

export class StubOcrProvider implements OcrProvider {
  readonly name = 'stub_ocr_provider';

  async extractFromReceipt(receiptId: string, _fileBuffer: Buffer, _mimeType: string): Promise<OcrResult> {
    return {
      provider: this.name,
      overallConfidence: 0.92,
      merchant: {
        value: 'ITC Hotels Ltd - Bangalore',
        confidence: 0.95,
        source: 'extracted',
      },
      date: {
        value: new Date().toISOString().split('T')[0],
        confidence: 0.98,
        source: 'extracted',
      },
      amount: {
        value: '4500.00',
        confidence: 0.94,
        source: 'extracted',
      },
      currency: {
        value: 'INR',
        confidence: 0.99,
        source: 'inferred',
      },
      invoiceNumber: {
        value: 'INV-BLR-2026-8941',
        confidence: 0.88,
        source: 'extracted',
      },
      taxAmount: {
        value: '810.00',
        confidence: 0.91,
        source: 'extracted',
      },
      gstin: {
        value: '29AABCI1234F1Z5',
        confidence: 0.89,
        source: 'extracted',
      },
      rawResponse: {
        receiptId,
        mockProvider: 'StubOcrEngine-v1',
        pages: 1,
      },
    };
  }
}
