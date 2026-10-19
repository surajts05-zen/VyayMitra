import React from 'react';

interface AmountDisplayProps {
  amount: string | number;
  currency?: string;
  className?: string;
  fractionDigits?: number;
  showSign?: boolean;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  currency = 'INR',
  className = '',
  fractionDigits = 2,
  showSign = false,
}) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const isNegative = num < 0;

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(num));

  return (
    <span
      className={`font-mono font-medium tracking-tight ${
        isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
      } ${className}`}
    >
      {showSign && !isNegative && '+'}
      {isNegative && '-'}
      {formatted}
    </span>
  );
};
