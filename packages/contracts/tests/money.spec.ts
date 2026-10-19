import { describe, it, expect } from 'vitest';
import { Money, verifyAllocationsSum, calculateTaxComponents } from '../src/money.js';

describe('Financial Money Arithmetic', () => {
  it('should accurately add monetary values without floating point drift', () => {
    // 0.1 + 0.2 in standard JS float is 0.30000000000000004
    const a = new Money('0.10');
    const b = new Money('0.20');
    const result = a.add(b);
    expect(result.toDecimalPlaces(2)).toBe('0.30');
    expect(result.toDbString()).toBe('0.300000');
  });

  it('should verify allocation line sums correctly', () => {
    const total = '1000.00';
    const lines = ['250.25', '350.25', '399.50'];
    expect(verifyAllocationsSum(total, lines)).toBe(true);

    const badLines = ['250.25', '350.25', '400.00'];
    expect(verifyAllocationsSum(total, badLines)).toBe(false);
  });

  it('should accurately calculate inclusive GST (18%) components', () => {
    // Gross: 1180.00, Tax rate: 18% -> Base: 1000.00, Tax: 180.00
    const calc = calculateTaxComponents('1180.00', '18.0', true);
    expect(calc.subtotal).toBe('1000.00');
    expect(calc.taxAmount).toBe('180.00');
    expect(calc.totalAmount).toBe('1180.00');
  });

  it('should accurately calculate exclusive GST (18%) components', () => {
    // Net: 1000.00, Tax rate: 18% -> Tax: 180.00, Total: 1180.00
    const calc = calculateTaxComponents('1000.00', '18.0', false);
    expect(calc.subtotal).toBe('1000.00');
    expect(calc.taxAmount).toBe('180.00');
    expect(calc.totalAmount).toBe('1180.00');
  });

  it('should reject invalid decimal strings', () => {
    expect(() => new Money('abc')).toThrow('Invalid decimal string: abc');
    expect(() => new Money('12.34.56')).toThrow('Invalid decimal string: 12.34.56');
  });
});
