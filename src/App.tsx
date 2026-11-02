import { Compass, MapPinned } from 'lucide-react';
import { dataNote } from './components/CityPicker';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { CITIES } from './data/cities';
import { Workspace } from './components/Workspace';
import { useComparator } from './state/useComparator';
import { useTheme } from './state/useTheme';

export default function App() {
  const cmp = useComparator();
  const theme = useTheme();

  return (
    <div className="app-glow min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50 text-zinc-900 antialiased">
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
        {cmp.state.phase === 'loaded' && cmp.view ? (
          <Workspace state={cmp.state} view={cmp.view} actions={cmp} />
        ) : (
          <section aria-labelledby="landing-title" className="mx-auto max-w-5xl">
            <div className="text-center">
              <MapPinned className="mx-auto size-10 text-indigo-600" aria-hidden />
              <h2 id="landing-title" className="mt-3 text-lg font-semibold">
                Pick a city to plan your trip
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600">
                10 hotels, 15 wishlist places, one whole-stay budget. Load a city to compare weighted round-trip travel against price.
              </p>
            </div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {CITIES.map((c) => (
                <li key={c.id} className="card flex flex-col p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold">{c.name}</h3>
                    <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-500/20">
                      {c.country} · {c.currency.symbol}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{c.blurb}</p>
                  <p className="mt-2 text-xs text-zinc-500">{dataNote(c.fictional)}</p>
                  <button
                    type="button"
                    onClick={() => cmp.load(c.id)}
                    className="mt-4 self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_-4px] shadow-indigo-500/60 transition duration-150 hover:bg-indigo-500 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Load {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
