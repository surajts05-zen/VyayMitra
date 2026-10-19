import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Ban,
  FileCheck,
} from 'lucide-react';
import { ReportStatus, ReimbursementStatus, PostingStatus } from '@vyay/contracts';

interface StatusBadgeProps {
  status: ReportStatus | ReimbursementStatus | PostingStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeConfig = (s: string) => {
    switch (s) {
      case ReportStatus.APPROVED:
      case ReportStatus.FINALIZED:
      case ReimbursementStatus.PAID:
      case PostingStatus.SYNCED:
        return {
          bg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />,
          label: s.replace('_', ' '),
        };
      case ReportStatus.SUBMITTED:
      case ReportStatus.IN_REVIEW:
      case ReportStatus.FINANCE_REVIEW:
      case ReimbursementStatus.SCHEDULED:
      case PostingStatus.QUEUED:
        return {
          bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />,
          label: s.replace('_', ' '),
        };
      case ReportStatus.CHANGES_REQUESTED:
      case PostingStatus.NEEDS_RECONCILIATION:
      case ReimbursementStatus.PARTIALLY_PAID:
        return {
          bg: 'bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-600 dark:text-orange-400" />,
          label: s.replace('_', ' '),
        };
      case ReportStatus.REJECTED:
      case ReimbursementStatus.CANCELLED:
      case PostingStatus.BLOCKED:
        return {
          bg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600 dark:text-rose-400" />,
          label: s.replace('_', ' '),
        };
      case PostingStatus.SYNCING:
      case PostingStatus.RETRYABLE_FAILURE:
        return {
          bg: 'bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin text-purple-600 dark:text-purple-400" />,
          label: s.replace('_', ' '),
        };
      case ReimbursementStatus.ON_HOLD:
        return {
          bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
          icon: <Ban className="w-3.5 h-3.5 mr-1 text-slate-500" />,
          label: 'ON HOLD',
        };
      case ReportStatus.DRAFT:
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          icon: <FileCheck className="w-3.5 h-3.5 mr-1 text-slate-500" />,
          label: s.replace('_', ' '),
        };
    }
  };

  const config = getBadgeConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
