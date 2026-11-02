import { render, screen, waitFor, within } from '@testing-library/react';
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

  describe('map', () => {
    const svg = () => document.querySelector('svg[data-zoom]') as SVGSVGElement;

    it('zooms in and out with buttons and resets; zoom never changes the result', async () => {
      const user = await loadApp();
      expect(svg()).toHaveAttribute('viewBox', '0 0 1000 640');
      expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
      await user.click(screen.getByRole('button', { name: 'Zoom in' }));
      await waitFor(() => expect(svg().getAttribute('data-zoom')).toBe('1.50'), { timeout: 4000 });
      expect(svg().getAttribute('viewBox')).not.toBe('0 0 1000 640');
      expect(screen.getByText(/Recommended base camp: Lamplighter Lodge/)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Reset map view' }));
      await waitFor(() => expect(svg()).toHaveAttribute('viewBox', '0 0 1000 640'), { timeout: 4000 });
      expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    });

    it('keyboard +, - and 0 zoom the map from a focused marker', async () => {
      const user = await loadApp();
      const marker = document.querySelector('[data-testid="hotel-H_LANTERN"]') as SVGElement;
      marker.focus();
      await user.keyboard('+');
      await waitFor(() => expect(svg().getAttribute('data-zoom')).toBe('1.50'), { timeout: 4000 });
      await user.keyboard('0');
      await waitFor(() => expect(svg().getAttribute('data-zoom')).toBe('1.00'), { timeout: 4000 });
    });

    it('shows a details card when a hotel is hovered or a place is hovered', async () => {
      const user = await loadApp();
      await user.hover(screen.getByTestId('hotel-H_CLOCKGR'));
      expect(document.querySelector('.map-tip')).toHaveTextContent('Clocktower Grand');
      expect(document.querySelector('.map-tip')).toHaveTextContent('Stay $980 · Over budget by $80');
      expect(screen.getByText('Click to inspect')).toBeInTheDocument();
      await user.unhover(screen.getByTestId('hotel-H_CLOCKGR'));
      expect(screen.queryByText('Click to inspect')).toBeNull();
      await user.hover(screen.getByTestId('place-RIVER'));
      expect(screen.getByText(/of its total\)/)).toBeInTheDocument();
    });

    it('layer toggles hide names and link values, and Top 5 keeps exactly five links', async () => {
      const user = await loadApp();
      expect(screen.getAllByText(/min · ×\d = \d+/).length).toBe(15);
      await user.click(screen.getByRole('button', { name: 'Link values' }));
      expect(screen.queryAllByText(/min · ×\d = \d+/)).toHaveLength(0);
      await user.click(screen.getByRole('button', { name: 'Names' }));
      expect(screen.queryByText('Riverside Walk', { selector: 'svg text' })).toBeNull();
      await user.click(screen.getByRole('button', { name: /top 5 links only/i }));
      expect(document.querySelectorAll('[data-testid^="link-"]')).toHaveLength(5);
      expect(document.querySelector('[data-testid="link-RIVER"]')).not.toBeNull(); // 250, the largest contribution
      await user.click(screen.getByRole('button', { name: /top 5 links only/i }));
      expect(document.querySelectorAll('[data-testid^="link-"]')).toHaveLength(15);
    });

    it('invalid input still clears every link and the tooltip data', async () => {
      const user = await loadApp();
      const budget = screen.getByLabelText(/whole-stay hotel budget/i);
      await user.clear(budget);
      await user.type(budget, '-5');
      expect(document.querySelectorAll('[data-testid^="link-"]')).toHaveLength(0);
      await user.hover(screen.getByTestId('hotel-H_LANTERN'));
      expect(screen.getByText('No comparison while input is invalid.')).toBeInTheDocument();
    });
  });

  describe('cities', () => {
    const loadCity = async (name: string) => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(screen.getByRole('button', { name: new RegExp(`load ${name}`, 'i') }));
      return user;
    };

    it('the landing screen offers every city and shows nothing else yet', () => {
      render(<App />);
      for (const name of ['Marlowe Bay', 'Hyderabad', 'Kyoto', 'Lisbon']) expect(screen.getByRole('button', { name: `Load ${name}` })).toBeInTheDocument();
      expect(screen.getAllByText(/invented/i).length).toBeGreaterThanOrEqual(3);
      expect(screen.queryByRole('radiogroup', { name: 'City' })).toBeNull();
    });

    it('Hyderabad loads with rupees, its own map and its own recommendation', async () => {
      await loadCity('Hyderabad');
      expect(screen.getByText(/Recommended base camp: Banjara Heights/)).toBeInTheDocument();
      expect(screen.getByText(/at a ₹20,500 budget/)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Hyderabad schematic map' })).toBeInTheDocument();
      expect(screen.getByLabelText(/whole-stay hotel budget/i)).toHaveValue('20500');
      expect(screen.getAllByText('Over budget by ₹9,500').length).toBeGreaterThan(0);
      expect(screen.getByRole('radio', { name: 'Hyderabad' })).toBeChecked();
      expect(screen.getByLabelText('Importance for Charminar')).toHaveValue('5');
      expect(document.querySelectorAll('[data-testid^="hotel-"]')).toHaveLength(10);
      expect(document.querySelectorAll('[data-testid^="place-"]')).toHaveLength(15);
      expect(document.querySelectorAll('[data-testid^="link-"]')).toHaveLength(15);
      expect(screen.queryByText(/Lamplighter/)).toBeNull();
    });

    it('the picker switches cities, loads that city\'s original trip and keeps results consistent', async () => {
      const user = await loadCity('Marlowe Bay');
      expect(screen.getByText(/Recommended base camp: Lamplighter Lodge/)).toBeInTheDocument();
      await user.click(screen.getByRole('radio', { name: 'Kyoto' }));
      expect(screen.getByText(/Recommended base camp: Fushimi Gate Lodge/)).toBeInTheDocument();
      expect(screen.getByLabelText(/whole-stay hotel budget/i)).toHaveValue('56000');
      expect(screen.getByText(/at a ¥56,000 budget/)).toBeInTheDocument();
      expect(screen.queryByText(/Lamplighter/)).toBeNull();
      await user.click(screen.getByRole('radio', { name: 'Lisbon' }));
      expect(screen.getByText(/Recommended base camp: Avenida Suites/)).toBeInTheDocument();
      expect(screen.getByText(/at a €790 budget/)).toBeInTheDocument();
      await user.click(screen.getByRole('radio', { name: 'Marlowe Bay' }));
      expect(screen.getByText(/at a \$900 budget/)).toBeInTheDocument();
    });

    it('switching city discards edits, and Reset restores the current city, not Marlowe Bay', async () => {
      const user = await loadCity('Hyderabad');
      const budget = screen.getByLabelText(/whole-stay hotel budget/i);
      await user.clear(budget);
      await user.type(budget, '34000');
      expect(screen.getByText(/Modified: budget/)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /reset trip/i }));
      expect(screen.getByLabelText(/whole-stay hotel budget/i)).toHaveValue('20500');
      expect(screen.getByText(/Recommended base camp: Banjara Heights/)).toBeInTheDocument();
      expect(screen.getByText('Showing the original trip.')).toBeInTheDocument();
      await user.clear(screen.getByLabelText(/whole-stay hotel budget/i));
      await user.type(screen.getByLabelText(/whole-stay hotel budget/i), '1');
      await user.click(screen.getByRole('radio', { name: 'Kyoto' }));
      expect(screen.getByText('Showing the original trip.')).toBeInTheDocument();
    });

    it('arrow keys move between cities in the picker', async () => {
      const user = await loadCity('Marlowe Bay');
      screen.getByRole('radio', { name: 'Marlowe Bay' }).focus();
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('radio', { name: 'Hyderabad' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Hyderabad' })).toHaveFocus();
      await user.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(screen.getByRole('radio', { name: 'Lisbon' })).toBeChecked();
    });

    it('the budget cliff, no-affordable and invalid rules hold in a demo city, with that city\'s currency', async () => {
      const user = await loadCity('Hyderabad');
      const budget = screen.getByLabelText(/whole-stay hotel budget/i);
      await user.clear(budget);
      await user.type(budget, '30000'); // Abids Courtyard (the most accessible) costs exactly 30,000
      expect(screen.getByText(/Recommended base camp: Abids Courtyard/)).toBeInTheDocument();
      await user.clear(budget);
      await user.type(budget, '29999');
      expect(screen.queryByText(/Recommended base camp: Abids Courtyard/)).toBeNull();
      await user.clear(budget);
      await user.type(budget, '0');
      expect(within(screen.getByRole('status')).getByText('NO_AFFORDABLE_HOTEL')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('₹');
      await user.clear(budget);
      await user.type(budget, '-5');
      expect(document.querySelectorAll('[data-testid^="link-"]')).toHaveLength(0);
      expect(screen.getAllByRole('alert').map((el) => el.textContent).join(' ')).toContain('INVALID INPUT');
    });

    it('Copy summary uses the city\'s currency', async () => {
      const user = await loadCity('Hyderabad');
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
      await user.click(screen.getByRole('button', { name: /copy summary/i }));
      const text = writeText.mock.calls[0]![0];
      expect(text).toContain('Recommended base camp: Banjara Heights (₹20,000) at a ₹20,500 budget.');
      expect(text).not.toContain('$');
    });

    it('map hover cards, zoom and layers work with a demo city\'s markers', async () => {
      const user = await loadCity('Lisbon');
      await user.hover(screen.getByTestId('hotel-H_BAIRRO'));
      expect(document.querySelector('.map-tip')).toHaveTextContent('Bairro Alto Loft');
      expect(document.querySelector('.map-tip')).toHaveTextContent('€');
      await user.click(screen.getByRole('button', { name: /top 5 links only/i }));
      expect(document.querySelectorAll('[data-testid^="link-"]')).toHaveLength(5);
    });
  });
});

