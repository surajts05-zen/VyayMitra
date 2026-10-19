import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PolicyViolationDto } from '@vyay/contracts';

interface ReportEvaluationInput {
  id: string;
  totalAmount: string;
  currency: string;
  expenses: {
    id: string;
    amount: string;
    merchant: string;
    receiptIds: string[];
    duplicateWarning: boolean;
  }[];
}

export interface PolicyEvaluationResult {
  passed: boolean;
  requiresEscalation: boolean;
  violations: PolicyViolationDto[];
}

@Injectable()
export class PolicyService {
  evaluateReport(
    tenantId: string,
    report: ReportEvaluationInput
  ): PolicyEvaluationResult {
    const violations: PolicyViolationDto[] = [];
    let requiresEscalation = false;

    const total = new Decimal(report.totalAmount);
    // Escalation rule: total amount > 50,000 INR requires Executive / Owner escalation
    const escalationThreshold = new Decimal('50000.00');
    if (total.gt(escalationThreshold)) {
      requiresEscalation = true;
      violations.push({
        ruleType: 'AMOUNT_THRESHOLD_ESCALATION',
        severity: 'ESCALATE',
        message: `Total claim amount (${report.currency} ${total.toFixed(2)}) exceeds standard manager limit (${report.currency} 50,000.00). Requires executive escalation.`,
      });
    }

    // Per-expense policy checks
    const receiptThreshold = new Decimal('1000.00');
    for (const exp of report.expenses) {
      const expAmount = new Decimal(exp.amount);

      // Rule: Missing Receipt on items > 1,000
      if (expAmount.gte(receiptThreshold) && (!exp.receiptIds || exp.receiptIds.length === 0)) {
        violations.push({
          ruleType: 'MISSING_RECEIPT',
          severity: 'WARN',
          message: `Expense at '${exp.merchant}' for ${exp.amount} exceeds receipt threshold of 1,000 but has no receipt attached.`,
          expenseId: exp.id,
        });
      }

      // Rule: Duplicate Claim Warning
      if (exp.duplicateWarning) {
        violations.push({
          ruleType: 'DUPLICATE_CLAIM',
          severity: 'WARN',
          message: `Expense at '${exp.merchant}' was flagged as a potential duplicate claim. Approver review required.`,
          expenseId: exp.id,
        });
      }
    }

    const hasBlock = violations.some((v) => v.severity === 'BLOCK');
    return {
      passed: !hasBlock,
      requiresEscalation,
      violations,
    };
  }
}
