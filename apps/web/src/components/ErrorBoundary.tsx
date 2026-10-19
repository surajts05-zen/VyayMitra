import React from 'react';

interface State {
  failed: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error): void {
    console.error('Page rendering failed', { name: error.name });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900 dark:bg-[#151F27]">
        <h1 className="text-xl font-semibold">This page could not be displayed</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Your financial data was not changed. Reload the page, or contact support with the request time if the problem continues.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 min-h-11 rounded-xl bg-[#008C69] px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
        >
          Reload application
        </button>
      </section>
    );
  }
}

