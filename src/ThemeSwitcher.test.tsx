import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

/** Minimal controllable matchMedia: lets a test flip the "OS" between light and dark. */
function mockSystem(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes('dark') ? dark : false;
    },
    media: query,
    addEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.add(l),
    removeEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.delete(l),
  })) as unknown as typeof window.matchMedia;
  return {
    setDark(next: boolean) {
      dark = next;
      act(() => listeners.forEach((l) => l({ matches: next } as MediaQueryListEvent)));
    },
  };
}

const theme = () => document.documentElement.dataset.theme;
const radio = (name: RegExp) => screen.getByRole('radio', { name });

afterEach(() => {
  // @ts-expect-error jsdom has no matchMedia by default; restore that state
  delete window.matchMedia;
});

describe('ThemeSwitcher', () => {
  it('offers Light, Dark and System, defaulting to System', () => {
    mockSystem(false);
    render(<App />);
    const group = screen.getByRole('radiogroup', { name: 'Color theme' });
    expect(group).toBeInTheDocument();
    expect(radio(/light theme/i)).toHaveAttribute('aria-checked', 'false');
    expect(radio(/dark theme/i)).toHaveAttribute('aria-checked', 'false');
    expect(radio(/system theme/i)).toHaveAttribute('aria-checked', 'true');
    expect(theme()).toBe('light');
  });

  it('System follows the OS, live', () => {
    const sys = mockSystem(true);
    render(<App />);
    expect(theme()).toBe('dark');
    sys.setDark(false);
    expect(theme()).toBe('light');
  });

  it('explicit Dark/Light override the OS and persist', async () => {
    const sys = mockSystem(false);
    const user = userEvent.setup();
    render(<App />);
    await user.click(radio(/dark theme/i));
    expect(theme()).toBe('dark');
    expect(window.localStorage.getItem('theme-pref')).toBe('dark');
    sys.setDark(false); // OS changes are ignored while an explicit choice is active
    expect(theme()).toBe('dark');
    await user.click(radio(/light theme/i));
    expect(theme()).toBe('light');
    expect(window.localStorage.getItem('theme-pref')).toBe('light');
  });

  it('restores the saved preference on the next visit', () => {
    mockSystem(false);
    window.localStorage.setItem('theme-pref', 'dark');
    render(<App />);
    expect(theme()).toBe('dark');
    expect(radio(/dark theme/i)).toHaveAttribute('aria-checked', 'true');
  });

  it('supports arrow-key navigation with a roving tabindex', async () => {
    mockSystem(false);
    const user = userEvent.setup();
    render(<App />);
    radio(/system theme/i).focus();
    await user.keyboard('{ArrowRight}'); // wraps System -> Light
    expect(radio(/light theme/i)).toHaveAttribute('aria-checked', 'true');
    expect(radio(/light theme/i)).toHaveAttribute('tabindex', '0');
    expect(radio(/dark theme/i)).toHaveAttribute('tabindex', '-1');
    await user.keyboard('{ArrowLeft}{ArrowLeft}'); // Light -> System -> Dark
    expect(theme()).toBe('dark');
  });

  it('does not affect the comparison result', async () => {
    mockSystem(false);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /load marlowe bay/i }));
    await user.click(radio(/dark theme/i));
    expect(screen.getByText(/Recommended base camp: Lamplighter Lodge/)).toBeInTheDocument();
  });
});
