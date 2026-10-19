import { z } from 'zod';

export const PresignReceiptUploadSchema = z.object({
  expenseId: z.string().uuid().optional(),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]),
  fileSize: z.number().int().min(1).max(10 * 1024 * 1024), // Max 10MB
});
export type PresignReceiptUploadInput = z.infer<typeof PresignReceiptUploadSchema>;

export const ConfirmReceiptUploadSchema = z.object({
  expenseId: z.string().uuid().optional(),
  storageKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  fileSize: z.number().int().min(1),
  fileHash: z.string().length(64), // SHA-256
});
export type ConfirmReceiptUploadInput = z.infer<typeof ConfirmReceiptUploadSchema>;

export const ReceiptDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  expenseId: z.string().uuid().nullable().optional(),
  storageKey: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number().int(),
  fileHash: z.string(),
  downloadUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  ocrStatus: z.enum(['NONE', 'QUEUED', 'PROCESSED', 'FAILED']).default('NONE'),
  createdAt: z.string(),
});
export type ReceiptDto = z.infer<typeof ReceiptDtoSchema>;

export const OcrFieldSchema = z.object({
  value: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.enum(['extracted', 'inferred']).default('extracted'),
});

export const OcrJobDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  receiptId: z.string().uuid(),
  expenseId: z.string().uuid().nullable().optional(),
  provider: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  overallConfidence: z.number().min(0).max(1),
  merchant: OcrFieldSchema.optional(),
  date: OcrFieldSchema.optional(),
  amount: OcrFieldSchema.optional(),
  currency: OcrFieldSchema.optional(),
  invoiceNumber: OcrFieldSchema.optional(),
  taxAmount: OcrFieldSchema.optional(),
  gstin: OcrFieldSchema.optional(),
  reviewedAt: z.string().nullable().optional(),
  reviewedBy: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type OcrJobDto = z.infer<typeof OcrJobDtoSchema>;

export const ConfirmOcrReviewSchema = z.object({
  ocrJobId: z.string().uuid(),
  acceptedFields: z.array(z.string()),
  overriddenValues: z.record(z.string()).optional(),
});
export type ConfirmOcrReviewInput = z.infer<typeof ConfirmOcrReviewSchema>;

export const DuplicateMatchDtoSchema = z.object({
  matchType: z.enum(['EXACT_HASH', 'FUZZY']),
  existingExpenseId: z.string().uuid(),
  merchant: z.string(),
  amount: z.string(),
  spentAt: z.string(),
  similarityScore: z.number(),
  reason: z.string(),
});
export type DuplicateMatchDto = z.infer<typeof DuplicateMatchDtoSchema>;
