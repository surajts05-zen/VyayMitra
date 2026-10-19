import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, X } from 'lucide-react';

const STORAGE_KEY = 'vyaymitra:onboarding:v1';
const items = [
  { id: 'profile', label: 'Confirm company and fiscal-year settings', path: '/settings' },
  { id: 'expense', label: 'Review or create your first expense', path: '/expenses' },
  { id: 'reports', label: 'Learn the report approval flow', path: '/reports' },
  { id: 'finance', label: 'Review finance and reimbursement separation', path: '/finance' },
];

interface Props {
  onNavigate: (path: string) => void;
}

interface StoredState {
  dismissed: boolean;
  completed: string[];
}

function readState(): StoredState {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as StoredState : { dismissed: false, completed: [] };
  } catch {
    return { dismissed: false, completed: [] };
  }
}

export function OnboardingChecklist({ onNavigate }: Props) {
  const [state, setState] = useState<StoredState>(readState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  if (state.dismissed) return null;

  const toggle = (id: string) => {
    setState((current) => ({
      ...current,
      completed: current.completed.includes(id)
        ? current.completed.filter((item) => item !== id)
        : [...current.completed, id],
    }));
  };

  return (
    <aside aria-labelledby="getting-started-title" className="mb-6 min-w-0 max-w-full overflow-hidden rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900 dark:bg-[#151F27]">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#008C69]">Getting started</p>
          <h2 id="getting-started-title" className="mt-1 text-lg font-semibold">Set up a safe expense workflow</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Approval, accounting export, and reimbursement are separate steps.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setState((current) => ({ ...current, dismissed: true }))}
          className="min-h-11 min-w-11 rounded-xl p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] dark:hover:bg-slate-800"
          aria-label="Dismiss getting started checklist"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <ul className="mt-4 grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((item) => {
          const complete = state.completed.includes(item.id);
          return (
            <li key={item.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="min-h-11 min-w-11 rounded-lg p-2 text-[#008C69] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
                aria-label={`${complete ? 'Mark incomplete' : 'Mark complete'}: ${item.label}`}
                aria-pressed={complete}
              >
                {complete ? <CheckCircle2 aria-hidden="true" /> : <Circle aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`min-h-11 min-w-0 flex-1 break-words rounded-lg px-2 text-left text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${complete ? 'text-slate-500 line-through' : ''}`}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-slate-500" aria-live="polite">
        {state.completed.length} of {items.length} onboarding steps complete
      </p>
    </aside>
  );
}
