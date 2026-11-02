import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import App from './App';

// jsdom cannot compute layout/colour, so contrast is checked by hand (see docs/EVIDENCE.md).
const audit = async () =>
  (
    await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    })
  ).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);

describe('accessibility (axe)', () => {
  it('has no violations on the landing screen, the loaded workspace, and invalid/no-affordable states', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await audit()).toEqual([]);

    await user.click(screen.getByRole('button', { name: /load marlowe bay/i }));
    expect(await audit()).toEqual([]);

    const budget = screen.getByLabelText(/whole-stay hotel budget/i);
    await user.clear(budget);
    await user.type(budget, '0');
    expect(await audit()).toEqual([]);

    await user.clear(budget);
    await user.type(budget, 'abc');
    expect(await audit()).toEqual([]);
  });

  it('communicates state with text or symbols, not colour alone', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /load marlowe bay/i }));
    expect(screen.getAllByText('Recommended').length).toBeGreaterThan(0); // card badge + legend
    expect(screen.getAllByText('Affordable').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Over budget by $80').length).toBeGreaterThan(0);
    const hotel = document.querySelector('[data-testid="hotel-H_CLOCKGR"]')!;
    expect(hotel).toHaveAttribute('aria-label', expect.stringContaining('over budget by 80'));
    expect(hotel.textContent).toContain('✕');
    expect(document.querySelector('[data-testid="hotel-H_LANTERN"]')!.textContent).toContain('★');
    expect(document.querySelector('[data-testid="place-CLOCK"]')).toHaveAttribute('aria-label', expect.stringMatching(/attraction/));
    expect(document.querySelector('[data-testid="place-NOODLE"]')).toHaveAttribute('aria-label', expect.stringMatching(/food/));
  });

  it('has no violations in each demo city, with the city picker and its map', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /load hyderabad/i }));
    expect(await audit()).toEqual([]);
    for (const name of ['Kyoto', 'Lisbon', 'Marlowe Bay']) {
      await user.click(screen.getByRole('radio', { name }));
      expect(await audit()).toEqual([]);
    }
  });
});

