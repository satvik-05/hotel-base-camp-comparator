import { Compass, MapPinned } from 'lucide-react';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { Workspace } from './components/Workspace';
import { useComparator } from './state/useComparator';
import { useTheme } from './state/useTheme';

export default function App() {
  const c = useComparator();
  const theme = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50 text-zinc-900 antialiased">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-surface/70 backdrop-blur-md supports-[backdrop-filter]:bg-surface/60">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_0_18px_-4px] shadow-indigo-500/70 ring-1 ring-white/20" aria-hidden>
            <Compass className="size-5" />
          </span>
          <div>
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">Hotel Base-Camp Comparator</h1>
            <p className="hidden text-sm text-zinc-600 sm:block">Real travel time versus real lodging cost, for the whole wishlist.</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-zinc-500/10 px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-500/20 md:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> Runs locally · no accounts · no network
            </span>
            <ThemeSwitcher pref={theme.pref} onChange={theme.choose} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {c.state.phase === 'loaded' && c.view ? (
          <Workspace state={c.state} view={c.view} actions={c} />
        ) : (
          <section className="mx-auto max-w-xl card p-8 text-center">
            <MapPinned className="mx-auto size-10 text-indigo-600" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold">Plan your Marlowe Bay trip</h2>
            <p className="mt-2 text-sm text-zinc-600">
              10 hotels, 15 wishlist places, one whole-stay budget. Load the city to compare weighted round-trip travel against price.
            </p>
            <button
              type="button"
              onClick={c.load}
              className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-[0_0_20px_-4px] shadow-indigo-500/60 transition duration-150 hover:bg-indigo-500 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Load Marlowe Bay
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
