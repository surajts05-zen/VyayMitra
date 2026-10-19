import { describe, it, expect, beforeEach } from 'vitest';
import { TallyPrimeConnector } from '../src/tally-connector.js';
import { TallyVoucherType } from '@vyay/contracts';

describe('TallyPrimeConnector', () => {
  let connector: TallyPrimeConnector;

  beforeEach(() => {
    connector = new TallyPrimeConnector('http://localhost:9000', 'Horizon Scientific India Pvt Ltd');
  });

  it('should declare correct connector capabilities', () => {
    expect(connector.name).toBe('tally_prime');
    expect(connector.capabilities.supportsBills).toBe(true);
    expect(connector.capabilities.supportsTaxMapping).toBe(true);
    expect(connector.capabilities.supportsVendorMapping).toBe(true);
  });

  it('should retrieve Indian Tally master reference ledgers and taxes', async () => {
    const refData = await connector.fetchReferenceData();
    expect(refData.accounts.length).toBeGreaterThan(0);
    expect(refData.taxes.length).toBeGreaterThan(0);

    const travelLedger = refData.accounts.find((a) => a.name === 'Travelling Expenses');
    expect(travelLedger).toBeDefined();

    const cgstTax = refData.accounts.find((a) => a.name.includes('Input CGST'));
    expect(cgstTax).toBeDefined();
  });

  it('should generate valid Tally XML Envelope with balanced Dr and Cr entries', () => {
    const xml = connector.generateTallyXml({
      voucherType: TallyVoucherType.PAYMENT,
      voucherNumber: 'VM-TEST-001',
      dateStr: '20261019',
      companyName: 'Horizon Scientific India Pvt Ltd',
      narration: 'October travel claim reimbursement voucher',
      debitEntries: [
        { ledgerName: 'Travelling Expenses', amount: 3813.56, costCenter: 'R&D' },
        { ledgerName: 'Input CGST @ 9%', amount: 343.22 },
        { ledgerName: 'Input SGST @ 9%', amount: 343.22 },
      ],
      creditEntries: [
        { ledgerName: 'HDFC Bank Current A/c', amount: 4500.00 },
      ],
    });

    expect(xml).toContain('<ENVELOPE>');
    expect(xml).toContain('<TALLYREQUEST>Import Data</TALLYREQUEST>');
    expect(xml).toContain('<VOUCHER VCHTYPE="Payment"');
    expect(xml).toContain('<LEDGERNAME>Travelling Expenses</LEDGERNAME>');
    expect(xml).toContain('<ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>');
    expect(xml).toContain('<AMOUNT>-3813.56</AMOUNT>');
    expect(xml).toContain('<LEDGERNAME>HDFC Bank Current A/c</LEDGERNAME>');
    expect(xml).toContain('<ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>');
    expect(xml).toContain('<AMOUNT>4500.00</AMOUNT>');
    expect(xml).toContain('</ENVELOPE>');
  });

  it('should post expense voucher and enforce idempotency', async () => {
    const payload = {
      reportTitle: 'October Travel Reimbursements',
      voucherType: 'Payment',
      expenseLedger: 'Travelling Expenses',
      bankLedger: 'HDFC Bank Current A/c',
      total: '4500.00',
    };
    const key = 'idem-tally-test-01';

    const post1 = await connector.postExpense(payload, 'token-1', 'org-1', key);
    expect(post1.status).toBe('ACCEPTED');
    expect(post1.remoteReference).toContain('VM-TALLY');
    expect(post1.responsePayload.xmlPayload).toBeDefined();

    const post2 = await connector.postExpense(payload, 'token-1', 'org-1', key);
    expect(post2.remoteReference).toBe(post1.remoteReference);
    expect(post2.externalId).toBe(post1.externalId);
  });
});
