import { useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Copy, SearchX } from 'lucide-react';
import type { ComparatorView } from '../state/derive';
import { money } from './format';

function CopySummary({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-surface/60 px-2.5 py-1 text-xs font-medium text-emerald-800 transition duration-150 hover:bg-surface active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy summary'}</span>
    </button>
  );
}

export function StatusBanner({ view }: { view: ComparatorView }) {
  const { result } = view;

  if (result.status === 'invalid') {
    return (
      <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-900 shadow-[0_0_24px_-8px] shadow-rose-500/40">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="size-5" aria-hidden /> INVALID INPUT — no comparison shown
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
          {view.problems.map((p, i) => (
            <li key={i}>
              <strong>{p.label}:</strong> {p.message}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm">Ranks, the recommendation, contributions and map links are cleared until this is fixed.</p>
      </div>
    );
  }

  if (result.outcome === 'NO_AFFORDABLE_HOTEL') {
    const cheapest = [...result.evaluations].sort((a, b) => a.stayCost - b.stayCost)[0]!;
    return (
      <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 shadow-[0_0_24px_-8px] shadow-amber-500/40">
        <p className="flex items-center gap-2 font-semibold">
          <SearchX className="size-5" aria-hidden /> NO_AFFORDABLE_HOTEL
        </p>
        <p className="mt-1 text-sm">
          No hotel fits a budget of {money(result.budget)}. There is no recommendation and no ranking. The cheapest stay,{' '}
          {cheapest.name}, is {money(cheapest.shortfall)} short — raise the budget to {money(cheapest.stayCost)} or more.
        </p>
      </div>
    );
  }

  const rec = result.recommended!;
  const summary = [
    `Recommended base camp: ${rec.name} (${money(rec.stayCost)}) at a ${money(result.budget)} budget.`,
    `${rec.weightedAverage} min weighted average round trip, ${money(rec.remainingBudget)} left over.`,
    ...result.ranking.map((e) => `#${e.rank} ${e.name} — ${money(e.stayCost)}, ${e.weightedAverage} min avg`),
  ].join('\n');
  return (
    <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-900 shadow-[0_0_24px_-8px] shadow-emerald-500/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-5" aria-hidden /> Recommended base camp: {rec.name}
        </p>
        <CopySummary text={summary} />
      </div>
      <p className="mt-1 text-sm">
        Best weighted travel among {result.ranking.length} affordable hotels at a {money(result.budget)} budget:{' '}
        {rec.weightedAverage} min average round trip, {money(rec.remainingBudget)} left over.
      </p>
    </div>
  );
}
