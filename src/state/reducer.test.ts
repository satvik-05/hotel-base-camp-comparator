import { deriveView } from './derive';
import { freshLoadedState, initialState, parseWhole, reducer, type LoadedState } from './reducer';

const loaded = (): LoadedState => reducer(initialState, { type: 'LOAD' }) as LoadedState;

describe('reducer', () => {
  it('starts empty and ignores edits until LOAD', () => {
    expect(reducer(initialState, { type: 'SET_BUDGET', value: '5' })).toBe(initialState);
    expect(loaded()).toMatchObject({ phase: 'loaded', budgetInput: '900', inspectedId: 'H_LANTERN' });
  });

  it('parseWhole is strict', () => {
    expect(parseWhole(' 42 ')).toBe(42);
    expect(parseWhole('-3')).toBe(-3);
    for (const bad of ['', 'abc', '1.5', '1e3', '1,000']) expect(parseWhole(bad)).toBeNaN();
  });

  it('inspecting changes only the inspected id, never the result', () => {
    const s = loaded();
    const t = reducer(s, { type: 'INSPECT', hotelId: 'H_DOCKS' }) as LoadedState;
    expect(t.inspectedId).toBe('H_DOCKS');
    expect(deriveView(t).result).toEqual(deriveView(s).result);
    expect(reducer(s, { type: 'INSPECT', hotelId: 'NOPE' })).toBe(s);
  });

  it('budget and importance edits flow through the engine', () => {
    let s = loaded();
    s = reducer(s, { type: 'SET_BUDGET', value: '980' }) as LoadedState;
    const v = deriveView(s);
    expect(v.result.status === 'ok' && v.result.recommended?.hotelId).toBe('H_CLOCKGR');
    s = reducer(loaded(), { type: 'SET_IMPORTANCE', placeId: 'RIVER', value: '5' }) as LoadedState;
    const w = deriveView(s);
    expect(w.result.status === 'ok' && w.result.recommended?.hotelId).toBe('H_RIVERST');
    expect(w.changedImportance.map((p) => p.id)).toEqual(['RIVER']);
  });

  it.each([['-1'], ['1000001'], ['abc'], ['']])('invalid budget %j clears everything derived', (raw) => {
    const v = deriveView(reducer(loaded(), { type: 'SET_BUDGET', value: raw }) as LoadedState);
    expect(v.result.status).toBe('invalid');
    expect(v.inspected).toBeNull();
    expect(v.mostAccessible).toBeNull();
    expect(v.budgetError).toBeTruthy();
  });

  it.each([['0'], ['6'], ['x']])('invalid importance %j clears everything derived', (raw) => {
    const v = deriveView(reducer(loaded(), { type: 'SET_IMPORTANCE', placeId: 'CLOCK', value: raw }) as LoadedState);
    expect(v.result.status).toBe('invalid');
    expect(v.inspected).toBeNull();
    expect(v.importanceErrors.CLOCK).toBeTruthy();
  });

  it('RESET restores budget, importances and inspected hotel exactly', () => {
    let s = loaded();
    s = reducer(s, { type: 'SET_BUDGET', value: '980' }) as LoadedState;
    s = reducer(s, { type: 'SET_IMPORTANCE', placeId: 'RIVER', value: '5' }) as LoadedState;
    s = reducer(s, { type: 'INSPECT', hotelId: 'H_DOCKS' }) as LoadedState;
    expect(deriveView(s).isOriginal).toBe(false);
    const r = reducer(s, { type: 'RESET' });
    expect(r).toEqual(freshLoadedState());
    expect(deriveView(r as LoadedState).isOriginal).toBe(true);
  });

  it('over-budget inspected hotel exposes what happens at its own cost', () => {
    const s = reducer(loaded(), { type: 'INSPECT', hotelId: 'H_CLOCKGR' }) as LoadedState;
    expect(deriveView(s).atItsCost).toEqual({ budget: 980, rank: 1, recommendedId: 'H_CLOCKGR' });
  });
});
