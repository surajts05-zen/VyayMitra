import { z } from 'zod';
import { PostingStatus } from './enums.js';

export const ExternalMappingSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  localType: z.enum(['CATEGORY', 'PAYMENT_SOURCE', 'TAX', 'PROJECT', 'VENDOR']),
  localId: z.string(),
  localName: z.string(),
  externalType: z.string(),
  externalId: z.string(),
  externalName: z.string(),
});
export type ExternalMapping = z.infer<typeof ExternalMappingSchema>;

export const UpdateMappingBatchSchema = z.object({
  mappings: z.array(
    z.object({
      localType: z.enum(['CATEGORY', 'PAYMENT_SOURCE', 'TAX', 'PROJECT', 'VENDOR']),
      localId: z.string(),
      externalType: z.string(),
      externalId: z.string(),
      externalName: z.string(),
    })
  ),
});
export type UpdateMappingBatchInput = z.infer<typeof UpdateMappingBatchSchema>;

export const PostingPreviewLineSchema = z.object({
  expenseId: z.string().uuid(),
  merchant: z.string(),
  amount: z.string(),
  categoryName: z.string(),
  glAccountId: z.string().nullable(),
  glAccountName: z.string().nullable(),
  taxCodeId: z.string().nullable(),
  taxCodeName: z.string().nullable(),
  paidThroughAccountId: z.string().nullable(),
  isMapped: z.boolean(),
});
export type PostingPreviewLine = z.infer<typeof PostingPreviewLineSchema>;

export const PostingPreviewSchema = z.object({
  reportId: z.string(),
  reportTitle: z.string(),
  totalAmount: z.string(),
  lines: z.array(PostingPreviewLineSchema),
  allMapped: z.boolean(),
  dryRunValidated: z.boolean().default(false),
  validationMessages: z.array(z.string()).default([]),
});
export type PostingPreview = z.infer<typeof PostingPreviewSchema>;

export const IntegrationJobDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  provider: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  status: z.nativeEnum(PostingStatus),
  attempts: z.number(),
  lastError: z.string().nullable().optional(),
  remoteReference: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IntegrationJobDto = z.infer<typeof IntegrationJobDtoSchema>;

// --- Zoho Books Specific Configuration & Export Schemas ---

export enum ZohoRegion {
  IN = 'IN',
  US = 'US',
  EU = 'EU',
  AU = 'AU',
  JP = 'JP',
  CA = 'CA',
}

export const ZohoConnectionConfigSchema = z.object({
  region: z.nativeEnum(ZohoRegion).default(ZohoRegion.IN),
  clientId: z.string().min(5),
  clientSecret: z.string().min(5),
  organizationId: z.string().optional(),
  organizationName: z.string().optional(),
  exportMode: z.enum(['EXPENSE', 'BILL']).default('BILL'),
  active: z.boolean().default(true),
});
export type ZohoConnectionConfig = z.infer<typeof ZohoConnectionConfigSchema>;

export const ZohoOrgDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  currencyCode: z.string().default('INR'),
  country: z.string().default('India'),
  isCurrent: z.boolean().default(false),
});
export type ZohoOrgDto = z.infer<typeof ZohoOrgDtoSchema>;

export const ExportReportRequestSchema = z.object({
  reportId: z.string(),
  exportMode: z.enum(['EXPENSE', 'BILL']).default('BILL'),
  dryRun: z.boolean().default(false),
});
export type ExportReportRequest = z.infer<typeof ExportReportRequestSchema>;

// --- Xero Configuration Schemas ---

export const XeroConnectionConfigSchema = z.object({
  tenantId: z.string().optional(),
  tenantName: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  exportMode: z.enum(['BILL', 'SPEND_MONEY', 'MANUAL_JOURNAL']).default('BILL'),
  active: z.boolean().default(true),
});
export type XeroConnectionConfig = z.infer<typeof XeroConnectionConfigSchema>;

export const XeroTenantDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  tenantType: z.string().default('ORGANISATION'),
  currencyCode: z.string().default('INR'),
  isCurrent: z.boolean().default(false),
});
export type XeroTenantDto = z.infer<typeof XeroTenantDtoSchema>;

// --- Tally Prime Configuration & XML Schemas ---

export enum TallyVoucherType {
  PAYMENT = 'Payment',
  JOURNAL = 'Journal',
  PURCHASE = 'Purchase',
}

export const TallyConnectionConfigSchema = z.object({
  companyName: z.string().default('VyayMitra Enterprise'),
  serverUrl: z.string().default('http://localhost:9000'),
  voucherType: z.nativeEnum(TallyVoucherType).default(TallyVoucherType.PAYMENT),
  cashBankLedger: z.string().default('Bank Account'),
  active: z.boolean().default(true),
});
export type TallyConnectionConfig = z.infer<typeof TallyConnectionConfigSchema>;

export const TallyXmlExportRequestSchema = z.object({
  reportId: z.string(),
  companyName: z.string().default('VyayMitra Enterprise'),
  voucherType: z.nativeEnum(TallyVoucherType).default(TallyVoucherType.PAYMENT),
  cashBankLedger: z.string().default('HDFC Bank Current A/c'),
  directSync: z.boolean().default(false),
});
export type TallyXmlExportRequest = z.infer<typeof TallyXmlExportRequestSchema>;

