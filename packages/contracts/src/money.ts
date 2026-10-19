import { Decimal } from 'decimal.js';

// Configure Decimal.js for financial accuracy
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class Money {
  private readonly val: Decimal;

  constructor(value: string | number | Decimal) {
    if (typeof value === 'string' && !/^-?\d+(\.\d+)?$/.test(value)) {
      throw new Error(`Invalid decimal string: ${value}`);
    }
    this.val = new Decimal(value);
  }

  static from(value: string | number | Decimal): Money {
    return new Money(value);
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money | string | number): Money {
    const o = other instanceof Money ? other.val : new Decimal(other);
    return new Money(this.val.plus(o));
  }

  sub(other: Money | string | number): Money {
    const o = other instanceof Money ? other.val : new Decimal(other);
    return new Money(this.val.minus(o));
  }

  mul(factor: Money | string | number | Decimal): Money {
    const f = factor instanceof Money ? factor.val : new Decimal(factor);
    return new Money(this.val.times(f));
  }

  div(divisor: Money | string | number | Decimal): Money {
    const d = divisor instanceof Money ? divisor.val : new Decimal(divisor);
    if (d.isZero()) {
      throw new Error('Division by zero in financial computation');
    }
    return new Money(this.val.dividedBy(d));
  }

  isGreaterThan(other: Money | string | number): boolean {
    const o = other instanceof Money ? other.val : new Decimal(other);
    return this.val.greaterThan(o);
  }

  isGreaterThanOrEqualTo(other: Money | string | number): boolean {
    const o = other instanceof Money ? other.val : new Decimal(other);
    return this.val.greaterThanOrEqualTo(o);
  }

  isLessThan(other: Money | string | number): boolean {
    const o = other instanceof Money ? other.val : new Decimal(other);
    return this.val.lessThan(o);
  }

  isLessThanOrEqualTo(other: Money | string | number): boolean {
    const o = other instanceof Money ? other.val : new Decimal(other);
    return this.val.lessThanOrEqualTo(o);
  }

  equals(other: Money | string | number): boolean {
    const o = other instanceof Money ? other.val : new Decimal(other);
    return this.val.equals(o);
  }

  /**
   * Quantize to standard currency fractional digits (default: 2 for INR/USD/EUR)
   */
  toDecimalPlaces(dp: number = 2): string {
    return this.val.toFixed(dp, Decimal.ROUND_HALF_UP);
  }

  toFixed(dp: number = 2): string {
    return this.toDecimalPlaces(dp);
  }

  isZero(): boolean {
    return this.val.isZero();
  }

  /**
   * Internal database string representation with full 6 decimal precision
   */
  toDbString(): string {
    return this.val.toFixed(6);
  }

  toDecimal(): Decimal {
    return this.val;
  }
}

/**
 * Calculates line items sum and verifies equality to reported total
 */
export function verifyAllocationsSum(
  totalAmount: string,
  lineAmounts: string[],
  precision: number = 2
): boolean {
  const total = new Money(totalAmount);
  const sum = lineAmounts.reduce((acc, curr) => acc.add(curr), Money.zero());
  return total.toDecimalPlaces(precision) === sum.toDecimalPlaces(precision);
}

/**
 * Calculate tax components
 */
export function calculateTaxComponents(
  subtotal: string,
  taxRatePercent: string,
  isInclusive: boolean
): { subtotal: string; taxAmount: string; totalAmount: string } {
  const sub = new Money(subtotal);
  const rate = new Money(taxRatePercent).div(100);

  if (isInclusive) {
    // total = subtotal (which was given as gross)
    // base = total / (1 + rate)
    // tax = total - base
    const total = sub;
    const base = total.div(new Money(1).add(rate));
    const tax = total.sub(base);
    return {
      subtotal: base.toDecimalPlaces(2),
      taxAmount: tax.toDecimalPlaces(2),
      totalAmount: total.toDecimalPlaces(2),
    };
  } else {
    // exclusive
    const tax = sub.mul(rate);
    const total = sub.add(tax);
    return {
      subtotal: sub.toDecimalPlaces(2),
      taxAmount: tax.toDecimalPlaces(2),
      totalAmount: total.toDecimalPlaces(2),
    };
  }
}
