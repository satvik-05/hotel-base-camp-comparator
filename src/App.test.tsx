import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const loadApp = async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /load marlowe bay/i }));
  return user;
};

describe('App smoke', () => {
  it('loads in one action and shows 25 markers with 15 links for the inspected hotel only', async () => {
    await loadApp();
    expect(screen.getByText(/Recommended base camp: Lamplighter Lodge/)).toBeInTheDocument();
    expect(document.querySelectorAll('[data-testid^="hotel-"]')).toHaveLength(10);
    expect(document.querySelectorAll('[data-testid^="place-"]')).toHaveLength(15);
    expect(document.querySelectorAll('[data-testid^="link-"]')).toHaveLength(15);
  });

  it('shows Over budget label, then recommends the accessible hotel at its price', async () => {
    const user = await loadApp();
    expect(screen.getAllByText('Over budget by $80').length).toBeGreaterThan(0);
    const budget = screen.getByLabelText(/whole-stay hotel budget/i);
    await user.clear(budget);
    await user.type(budget, '980');
    expect(screen.getByText(/Recommended base camp: Clocktower Grand/)).toBeInTheDocument();
  });

  it('invalid budget clears ranks, recommendation and links', async () => {
    const user = await loadApp();
    const budget = screen.getByLabelText(/whole-stay hotel budget/i);
    await user.clear(budget);
    await user.type(budget, '-5');
    expect(screen.getByText(/INVALID INPUT/)).toBeInTheDocument();
    expect(screen.queryByText(/Recommended base camp/)).toBeNull();
    expect(screen.queryByText('Recommended', { selector: 'span.rounded-full' })).toBeNull();
    expect(document.querySelectorAll('[data-testid^="link-"]')).toHaveLength(0);
    expect(within(screen.getByRole('region', { name: 'Ranked hotels' })).queryByRole('list', { name: /by rank/i })).toBeNull();
  });

  it('budget 0 shows NO_AFFORDABLE_HOTEL without a winner', async () => {
    const user = await loadApp();
    const budget = screen.getByLabelText(/whole-stay hotel budget/i);
    await user.clear(budget);
    await user.type(budget, '0');
    expect(within(screen.getByRole('status')).getByText('NO_AFFORDABLE_HOTEL')).toBeInTheDocument();
    expect(screen.queryByText(/Recommended base camp/)).toBeNull();
  });

  it('raising Riverside Walk importance in the table changes the recommendation and Reset restores it', async () => {
    const user = await loadApp();
    const river = screen.getByLabelText('Importance for Riverside Walk');
    await user.clear(river);
    await user.type(river, '5');
    expect(screen.getByText(/Recommended base camp: Riverside Rest/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /reset trip/i }));
    expect(screen.getByText(/Recommended base camp: Lamplighter Lodge/)).toBeInTheDocument();
    expect(screen.getByText('Showing the original trip.')).toBeInTheDocument();
  });

  it('timeline steps set the budget and mark the current range', async () => {
    const user = await loadApp();
    const timeline = screen.getByRole('region', { name: /budget timeline/i });
    const here = within(timeline).getByRole('button', { current: true });
    expect(here).toHaveTextContent('Recommend Lamplighter Lodge');
    await user.click(within(timeline).getByRole('button', { name: /Recommend Clocktower Grand/ }));
    expect(screen.getByLabelText(/whole-stay hotel budget/i)).toHaveValue('980');
    expect(screen.getByText(/Recommended base camp: Clocktower Grand/)).toBeInTheDocument();
  });

  it('inspecting a hotel by keyboard moves the links but not the result', async () => {
    const user = await loadApp();
    const dockyard = document.querySelector('[data-testid="hotel-H_DOCKS"]') as SVGElement;
    dockyard.focus();
    await user.keyboard('{Enter}');
    expect(dockyard).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelectorAll('[data-testid^="link-"]')).toHaveLength(15);
    expect(screen.getByText(/Recommended base camp: Lamplighter Lodge/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Why Dockyard Dorms?' })).toBeInTheDocument();
  });

  it('Copy summary puts the recommendation and ranking on the clipboard', async () => {
    const user = await loadApp();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    await user.click(screen.getByRole('button', { name: /copy summary/i }));
    expect(writeText).toHaveBeenCalledTimes(1);
    const text = writeText.mock.calls[0]![0];
    expect(text).toContain('Recommended base camp: Lamplighter Lodge ($760) at a $900 budget.');
    expect(text).toContain('#2 Riverside Rest');
    expect(text).not.toContain('Clocktower Grand');
    expect(await screen.findByText('Copied')).toBeInTheDocument();
  });

  it('re-keys the map links when a different hotel is inspected so they redraw', async () => {
    const user = await loadApp();
    const before = document.querySelector('[data-testid="link-RIVER"]');
    await user.click(screen.getByTestId('hotel-H_DOCKS'));
    expect(document.querySelector('[data-testid="link-RIVER"]')).not.toBe(before);
    expect(document.querySelectorAll('[data-testid^="link-"]')).toHaveLength(15);
  });
});
