import { Monitor, Moon, Sun } from 'lucide-react';
import { THEME_PREFS, type ThemePref } from '../theme';

const OPTIONS: Record<ThemePref, { label: string; Icon: typeof Sun }> = {
  light: { label: 'Light', Icon: Sun },
  dark: { label: 'Dark', Icon: Moon },
  system: { label: 'System', Icon: Monitor },
};

interface Props {
  pref: ThemePref;
  onChange: (pref: ThemePref) => void;
}

/** Compact three-way segmented control; arrow keys move between options (roving tabindex). */
export function ThemeSwitcher({ pref, onChange }: Props) {
  const move = (from: ThemePref, delta: number) => {
    const i = THEME_PREFS.indexOf(from);
    const next = THEME_PREFS[(i + delta + THEME_PREFS.length) % THEME_PREFS.length]!;
    onChange(next);
    requestAnimationFrame(() => document.getElementById(`theme-${next}`)?.focus());
  };

  return (
    <div role="radiogroup" aria-label="Color theme" className="inline-flex gap-0.5 rounded-lg bg-zinc-500/10 p-0.5 ring-1 ring-zinc-500/20">
      {THEME_PREFS.map((value) => {
        const { label, Icon } = OPTIONS[value];
        const selected = pref === value;
        return (
          <button
            key={value}
            id={`theme-${value}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                move(value, 1);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                move(value, -1);
              }
            }}
            className={`flex size-7 items-center justify-center rounded-md transition duration-150 focus-visible:outline-2 focus-visible:outline-indigo-600 ${
              selected ? 'bg-surface text-zinc-900 shadow-sm ring-1 ring-zinc-500/20' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
