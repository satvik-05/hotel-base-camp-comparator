import { Compass, MapPinned } from 'lucide-react';
import { Workspace } from './components/Workspace';
import { useComparator } from './state/useComparator';

export default function App() {
  const c = useComparator();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white" aria-hidden>
            <Compass className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Hotel Base-Camp Comparator</h1>
            <p className="text-sm text-slate-600">Real travel time versus real lodging cost, for the whole wishlist.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {c.state.phase === 'loaded' && c.view ? (
          <Workspace state={c.state} view={c.view} actions={c} />
        ) : (
          <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <MapPinned className="mx-auto size-10 text-indigo-600" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold">Plan your Marlowe Bay trip</h2>
            <p className="mt-2 text-sm text-slate-600">
              10 hotels, 15 wishlist places, one whole-stay budget. Load the city to compare weighted round-trip travel against price.
            </p>
            <button
              type="button"
              onClick={c.load}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Load Marlowe Bay
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
