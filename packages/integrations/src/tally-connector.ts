import {
  AccountingConnector,
  ConnectorCapabilities,
  ConnectionHealth,
  ExternalReferenceData,
  RemotePostingResult,
} from './interfaces.js';
import { ExternalMapping, PostingPreview, TallyVoucherType } from '@vyay/contracts';

export interface TallyVoucherLine {
  ledgerName: string;
  amount: string;
  isDebit: boolean;
  costCenter?: string;
  narration?: string;
}

export class TallyPrimeConnector implements AccountingConnector {
  readonly name = 'tally_prime';
  readonly capabilities: ConnectorCapabilities = {
    supportsExpenses: true,
    supportsBills: true,
    supportsReceiptAttachment: false, // Tally Prime stores vouchers locally; attachments link via narration
    supportsWebhooks: false,
    supportsTaxMapping: true,
    supportsVendorMapping: true,
    supportsProjectMapping: true,
  };

  private serverUrl: string = 'http://localhost:9000';
  private companyName: string = 'Horizon Scientific India Pvt Ltd';
  private simulatedFailureMode: 'NONE' | 'SERVER_UNREACHABLE' | 'XML_PARSE_ERROR' = 'NONE';
  private remoteLedger = new Map<string, RemotePostingResult>();

  constructor(serverUrl: string = 'http://localhost:9000', companyName: string = 'Horizon Scientific India Pvt Ltd') {
    this.serverUrl = serverUrl;
    this.companyName = companyName;
  }

  setServerUrl(url: string) {
    this.serverUrl = url;
  }

  setCompanyName(name: string) {
    this.companyName = name;
  }

  setFailureMode(mode: 'NONE' | 'SERVER_UNREACHABLE' | 'XML_PARSE_ERROR') {
    this.simulatedFailureMode = mode;
  }

  buildAuthUrl(): string {
    // Tally Prime is a premise/local network ERP and does not use OAuth redirect flows.
    return `${this.serverUrl}/#tally-direct-xml-gateway`;
  }

  async exchangeCode(): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    apiDomain: string;
  }> {
    return {
      accessToken: 'tally_local_xml_session_token',
      refreshToken: 'tally_local_refresh_token',
      expiresIn: 86400 * 365, // Long-lived local authorization
      apiDomain: this.serverUrl,
    };
  }

  async refreshToken(): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    return {
      accessToken: 'tally_local_xml_session_token',
      expiresIn: 86400 * 365,
    };
  }

  async testConnection(connectionId: string): Promise<ConnectionHealth> {
    if (this.simulatedFailureMode === 'SERVER_UNREACHABLE') {
      return {
        connected: false,
        provider: this.name,
        lastCheckedAt: new Date().toISOString(),
        error: `Could not reach Tally Prime XML Server at ${this.serverUrl}. Ensure Tally Prime is open and F12 Advanced Configuration -> 'Enable ODBC/HTTP Server' is set to Yes on Port 9000.`,
      };
    }

    return {
      connected: true,
      provider: this.name,
      externalOrgId: 'tally-comp-primary',
      externalOrgName: this.companyName,
      expiresInSeconds: 86400 * 365,
      scopes: ['TallyXML.ImportData', 'TallyXML.ExportData', 'TallyVouchers.Create'],
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async listOrganizations(): Promise<Array<{ id: string; name: string; currencyCode: string }>> {
    return [
      { id: 'tally-comp-primary', name: `${this.companyName} (Active Tally Company)`, currencyCode: 'INR' },
    ];
  }

  async fetchReferenceData(): Promise<ExternalReferenceData> {
    return {
      accounts: [
        { id: 'tally-led-travelling', name: 'Travelling Expenses', code: 'LED-EXP-01', type: 'Indirect Expenses' },
        { id: 'tally-led-conveyance', name: 'Local Conveyance & Fuel', code: 'LED-EXP-02', type: 'Indirect Expenses' },
        { id: 'tally-led-lodging', name: 'Hotel & Lodging Expenses', code: 'LED-EXP-03', type: 'Indirect Expenses' },
        { id: 'tally-led-hospitality', name: 'Business Meals & Entertainment', code: 'LED-EXP-04', type: 'Indirect Expenses' },
        { id: 'tally-led-software', name: 'Software & IT Subscriptions', code: 'LED-EXP-05', type: 'Indirect Expenses' },
        { id: 'tally-led-cgst', name: 'Input CGST @ 9%', code: 'LED-DUTY-01', type: 'Duties & Taxes' },
        { id: 'tally-led-sgst', name: 'Input SGST @ 9%', code: 'LED-DUTY-02', type: 'Duties & Taxes' },
        { id: 'tally-led-igst', name: 'Input IGST @ 18%', code: 'LED-DUTY-03', type: 'Duties & Taxes' },
        { id: 'tally-led-bank', name: 'HDFC Bank Current A/c', code: 'LED-BANK-01', type: 'Bank Accounts' },
        { id: 'tally-led-cash', name: 'Petty Cash A/c', code: 'LED-CASH-01', type: 'Cash-in-Hand' },
        { id: 'tally-led-emp-clearing', name: 'Employee Reimbursement Clearing A/c', code: 'LED-LIAB-01', type: 'Current Liabilities' },
      ],
      taxes: [
        { id: 'tally-tax-gst-18', name: 'GST 18% (CGST 9% + SGST 9%)', rate: '18.0' },
        { id: 'tally-tax-gst-12', name: 'GST 12% (CGST 6% + SGST 6%)', rate: '12.0' },
        { id: 'tally-tax-gst-5', name: 'GST 5% (CGST 2.5% + SGST 2.5%)', rate: '5.0' },
        { id: 'tally-tax-exempt', name: 'Exempt / Nil Rated', rate: '0.0' },
      ],
      vendors: [
        { id: 'tally-ven-indigo', name: 'InterGlobe Aviation Limited', gstin: '07AABCI1234F1Z1' },
        { id: 'tally-ven-itc', name: 'ITC Hotels Limited', gstin: '29AABCH9812K1Z9' },
        { id: 'tally-ven-uber', name: 'Uber India Systems Private Limited', gstin: '27AABCU5678G2Z2' },
      ],
      projects: [
        { id: 'tally-cc-101', name: 'Cost Centre: R&D Laboratory Ops' },
        { id: 'tally-cc-102', name: 'Cost Centre: Sales & Field Marketing' },
      ],
    };
  }

  async previewPosting(reportId: string, mappings: ExternalMapping[]): Promise<PostingPreview> {
    const isMapped = mappings.length > 0;
    const validationMessages: string[] = [];

    if (!isMapped) {
      validationMessages.push('Unmapped categories found. Map VyayMitra categories to Tally Master Ledgers.');
    } else {
      validationMessages.push('Success: Tally Master Ledgers and GST Input credit ledgers fully mapped.');
    }

    return {
      reportId,
      reportTitle: 'Preview Tally Prime XML Voucher Import',
      totalAmount: '4500.00',
      allMapped: isMapped,
      dryRunValidated: isMapped,
      validationMessages,
      lines: [
        {
          expenseId: 'exp-preview-1',
          merchant: 'ITC Hotels Limited',
          amount: '4500.00',
          categoryName: 'Lodging & Accommodation',
          glAccountId: isMapped ? 'tally-led-lodging' : null,
          glAccountName: isMapped ? 'Hotel & Lodging Expenses' : null,
          taxCodeId: isMapped ? 'tally-tax-gst-12' : null,
          taxCodeName: isMapped ? 'GST 12%' : null,
          paidThroughAccountId: 'tally-led-bank',
          isMapped,
        },
      ],
    };
  }

  /**
   * Generates a fully compliant Tally Prime XML Voucher string.
   */
  generateTallyXml(params: {
    voucherType: TallyVoucherType;
    voucherNumber: string;
    dateStr: string; // YYYYMMDD format
    companyName: string;
    narration: string;
    debitEntries: Array<{ ledgerName: string; amount: number; costCenter?: string }>;
    creditEntries: Array<{ ledgerName: string; amount: number }>;
  }): string {
    const { voucherType, voucherNumber, dateStr, companyName, narration, debitEntries, creditEntries } = params;

    let ledgerEntriesXml = '';

    // In Tally XML:
    // Debits: ISDEEMEDPOSITIVE = Yes, AMOUNT = negative value
    for (const d of debitEntries) {
      const amountVal = -Math.abs(d.amount);
      ledgerEntriesXml += `
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>${d.ledgerName}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>${amountVal.toFixed(2)}</AMOUNT>
            ${d.costCenter ? `
            <COSTCENTREALLOCATIONS.LIST>
              <NAME>${d.costCenter}</NAME>
              <AMOUNT>${amountVal.toFixed(2)}</AMOUNT>
            </COSTCENTREALLOCATIONS.LIST>` : ''}
          </ALLLEDGERENTRIES.LIST>`;
    }

    // Credits: ISDEEMEDPOSITIVE = No, AMOUNT = positive value
    for (const c of creditEntries) {
      const amountVal = Math.abs(c.amount);
      ledgerEntriesXml += `
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>${c.ledgerName}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>${amountVal.toFixed(2)}</AMOUNT>
          </ALLLEDGERENTRIES.LIST>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <DATA>
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER VCHTYPE="${voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
          <DATE>${dateStr}</DATE>
          <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
          <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
          <COMPANYNAME>${companyName}</COMPANYNAME>
          <NARRATION>${narration}</NARRATION>
          ${ledgerEntriesXml}
        </VOUCHER>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`.trim();
  }

  async postExpense(
    payload: Record<string, unknown>,
    accessToken: string,
    orgId: string,
    idempotencyKey: string
  ): Promise<RemotePostingResult> {
    if (this.simulatedFailureMode === 'SERVER_UNREACHABLE') {
      const err: any = new Error(`Connection refused: Tally Prime server at ${this.serverUrl} is not responding.`);
      err.status = 503;
      throw err;
    }
    if (this.simulatedFailureMode === 'XML_PARSE_ERROR') {
      const err: any = new Error('Tally Prime rejected XML: Tag mismatch or undefined Master Ledger name.');
      err.status = 400;
      throw err;
    }

    if (this.remoteLedger.has(idempotencyKey)) {
      return this.remoteLedger.get(idempotencyKey)!;
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const voucherNumber = `VM-TALLY-${Math.floor(10000 + Math.random() * 90000)}`;
    const total = Number(payload.total || 4500.0);
    const subtotal = Number(payload.subtotal || total * 0.82);
    const tax = total - subtotal;

    const xmlContent = this.generateTallyXml({
      voucherType: (payload.voucherType as TallyVoucherType) || TallyVoucherType.PAYMENT,
      voucherNumber,
      dateStr: today,
      companyName: this.companyName,
      narration: `VyayMitra Claim Ref: ${payload.reportTitle || 'Employee Expense Report'} [Idempotency: ${idempotencyKey}]`,
      debitEntries: [
        { ledgerName: (payload.expenseLedger as string) || 'Travelling Expenses', amount: subtotal },
        ...(tax > 0 ? [{ ledgerName: 'Input CGST @ 9%', amount: tax / 2 }, { ledgerName: 'Input SGST @ 9%', amount: tax / 2 }] : []),
      ],
      creditEntries: [
        { ledgerName: (payload.bankLedger as string) || 'HDFC Bank Current A/c', amount: total },
      ],
    });

    const externalId = `tally_vch_${Date.now()}`;
    const result: RemotePostingResult = {
      externalId,
      remoteReference: voucherNumber,
      status: 'ACCEPTED',
      postedAt: new Date().toISOString(),
      responsePayload: {
        voucherNumber,
        companyName: this.companyName,
        serverUrl: this.serverUrl,
        xmlPayload: xmlContent,
        voucherType: payload.voucherType || 'Payment',
        totalAmount: total.toFixed(2),
        idempotencyKey,
      },
    };

    this.remoteLedger.set(idempotencyKey, result);
    return result;
  }

  async retrieveStatus(externalId: string): Promise<'ACCEPTED' | 'NOT_FOUND' | 'PENDING'> {
    for (const item of this.remoteLedger.values()) {
      if (item.externalId === externalId) {
        return item.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING';
      }
    }
    return 'ACCEPTED';
  }

  async disconnect(connectionId: string): Promise<void> {
    this.remoteLedger.clear();
  }
}
