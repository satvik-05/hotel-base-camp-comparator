import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme,
  readStoredPref,
  resolveTheme,
  storePref,
  systemPrefersDark,
  watchSystemTheme,
  type ThemePref,
} from '../theme';

/** Theme preference (light | dark | system), persisted, applied to <html data-theme>. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readStoredPref);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  useEffect(() => watchSystemTheme(setSystemDark), []);

  const resolved = resolveTheme(pref, systemDark);
  useEffect(() => applyTheme(resolved), [resolved]);

  const choose = useCallback((next: ThemePref) => {
    storePref(next);
    setPref(next);
  }, []);

  return { pref, resolved, choose };
}
