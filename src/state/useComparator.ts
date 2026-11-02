import { useCallback, useMemo, useReducer } from 'react';
import { deriveView } from './derive';
import { initialState, reducer } from './reducer';

export function useComparator() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const view = useMemo(() => (state.phase === 'loaded' ? deriveView(state) : null), [state]);

  return {
    state,
    view,
    load: useCallback(() => dispatch({ type: 'LOAD' }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
    setBudget: useCallback((value: string) => dispatch({ type: 'SET_BUDGET', value }), []),
    setImportance: useCallback(
      (placeId: string, value: string) => dispatch({ type: 'SET_IMPORTANCE', placeId, value }),
      [],
    ),
    inspect: useCallback((hotelId: string) => dispatch({ type: 'INSPECT', hotelId }), []),
  };
}

export type Comparator = ReturnType<typeof useComparator>;
