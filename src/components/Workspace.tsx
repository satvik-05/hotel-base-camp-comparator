import { useState } from 'react';
import type { Comparator } from '../state/useComparator';
import type { ComparatorView } from '../state/derive';
import type { LoadedState } from '../state/reducer';
import { BudgetTimeline } from './BudgetTimeline';
import { CityMap } from './CityMap';
import { CityPicker } from './CityPicker';
import { Controls } from './Controls';
import { ExplanationPanel } from './ExplanationPanel';
import { HotelRanking } from './HotelRanking';
import { StatusBanner } from './StatusBanner';
import { TravelTable } from './TravelTable';

interface Props {
  state: LoadedState;
  view: ComparatorView;
  actions: Pick<Comparator, 'load' | 'setBudget' | 'setImportance' | 'reset' | 'inspect'>;
}

export function Workspace({ state, view, actions }: Props) {
  // Presentation-only hover link between map markers and table rows.
  const [hoverPlaceId, setHoverPlaceId] = useState<string | null>(null);

  const { result } = view;
  const bannerKey = result.status === 'invalid' ? 'invalid' : `${result.outcome}:${result.recommended?.hotelId ?? '-'}`;

  return (
    <div className="reveal-stack space-y-5">
      <CityPicker cityId={state.cityId} onChange={actions.load} />
      <Controls state={state} view={view} setBudget={actions.setBudget} reset={actions.reset} />
      <div key={bannerKey} className={bannerKey === 'start' ? undefined : 'anim-pop'}>
        <StatusBanner view={view} />
      </div>
      <BudgetTimeline view={view} onPickBudget={(b) => actions.setBudget(String(b))} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="space-y-5">
          <HotelRanking view={view} inspectedId={state.inspectedId} onInspect={actions.inspect} />
          <ExplanationPanel view={view} />
        </div>
        <div className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <CityMap view={view} hoverPlaceId={hoverPlaceId} onHoverPlace={setHoverPlaceId} inspectedId={state.inspectedId} onInspect={actions.inspect} />
        </div>
      </div>
      <TravelTable state={state} view={view} hoverPlaceId={hoverPlaceId} onHoverPlace={setHoverPlaceId} setImportance={actions.setImportance} onInspect={actions.inspect} />
    </div>
  );
}
