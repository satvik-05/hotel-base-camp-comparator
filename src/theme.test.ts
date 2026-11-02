import {
  applyTheme,
  isThemePref,
  readStoredPref,
  resolveTheme,
  storePref,
  systemPrefersDark,
  THEME_STORAGE_KEY,
  watchSystemTheme,
} from './theme';

describe('theme helpers', () => {
  it('resolves explicit prefs directly and system by the OS flag', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('validates stored values', () => {
    expect(['light', 'dark', 'system'].every(isThemePref)).toBe(true);
    for (const bad of ['', 'blue', null, undefined, 3]) expect(isThemePref(bad)).toBe(false);
  });

  it('reads and writes the preference, defaulting to system for missing or garbage values', () => {
    expect(readStoredPref()).toBe('system');
    storePref('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(readStoredPref()).toBe('dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    expect(readStoredPref()).toBe('system');
  });

  it('never throws when storage is unavailable', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStoredPref()).toBe('system');
    expect(() => storePref('dark')).not.toThrow();
    get.mockRestore();
    set.mockRestore();
  });

  it('applyTheme sets the data-theme attribute used by the CSS', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('tolerates environments without matchMedia', () => {
    expect(systemPrefersDark()).toBe(false);
    const off = watchSystemTheme(() => {});
    expect(off).toBeTypeOf('function');
    off();
  });
});
