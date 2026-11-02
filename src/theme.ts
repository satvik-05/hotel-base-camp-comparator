export type ThemePref = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Keep in sync with the inline script in index.html. */
export const THEME_STORAGE_KEY = 'theme-pref';
export const THEME_PREFS: readonly ThemePref[] = ['light', 'dark', 'system'];

const DARK_QUERY = '(prefers-color-scheme: dark)';

export const isThemePref = (v: unknown): v is ThemePref => v === 'light' || v === 'dark' || v === 'system';

export const resolveTheme = (pref: ThemePref, systemDark: boolean): ResolvedTheme =>
  pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;

export function systemPrefersDark(): boolean {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
  } catch {
    return false;
  }
}

/** Reads the saved preference; storage can be unavailable (private mode), so never throw. */
export function readStoredPref(): ThemePref {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePref(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

export function storePref(pref: ThemePref): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* preference simply won't persist */
  }
}

export function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.dataset.theme = resolved;
}

/** Subscribes to OS theme changes; returns an unsubscribe function. */
export function watchSystemTheme(onChange: (dark: boolean) => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mq = window.matchMedia(DARK_QUERY);
  const handler = (e: MediaQueryListEvent) => onChange(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
