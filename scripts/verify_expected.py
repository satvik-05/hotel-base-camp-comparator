#!/usr/bin/env python3
"""Independent check of the documented answers for every city (Marlowe Bay and the demo cities).

Does NOT import any TypeScript logic. It re-defines the scenario inputs (costs, importance,
place order) on its own, reads only the raw matrix numbers from src/data/travelMatrix.ts,
recomputes everything with its own formulas, and compares against src/data/expected.ts.
Exit code 0 = everything matches.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUDGET = 900
PLACES = ["CLOCK", "MUSEUM", "MARKET", "RIVER", "CASTLE", "BRIDGE", "GARDEN", "OBSERV",
          "NOODLE", "EELPIE", "BUNS", "CHOWDER", "TEA", "SKEWER", "CUSTARD"]
IMPORTANCE = dict(zip(PLACES, [5, 4, 5, 3, 2, 2, 1, 3, 4, 3, 2, 3, 1, 2, 1]))
COST = {"H_DOCKS": 520, "H_MOSSLN": 610, "H_TRAMDEP": 690, "H_LANTERN": 760, "H_WILLOW": 830,
        "H_RIVERST": 900, "H_CLOCKGR": 980, "H_OPAL": 1060, "H_MARIGOLD": 1150, "H_SKYLINE": 1290}

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def read_matrix():
    text = (ROOT / "src/data/travelMatrix.ts").read_text()
    rows = {}
    for hid, nums in re.findall(r"^\s*(H_[A-Z]+):\s*\[([\d,\s]+)\]", text, re.M):
        rows[hid] = [int(n) for n in nums.split(",")]
    return rows


def analyse(matrix, budget, imp):
    total_imp = sum(imp.values())
    totals = {h: sum(imp[p] * m for p, m in zip(PLACES, row)) for h, row in matrix.items()}
    affordable = sorted((h for h in COST if COST[h] <= budget), key=lambda h: (totals[h], COST[h], h))
    return total_imp, totals, affordable


def tenths(total, imp_total):
    # Exact rational round-half-up (independent of the TS integer formula's shape).
    from fractions import Fraction
    import math
    return math.floor(Fraction(total, imp_total) * 10 + Fraction(1, 2))


ID_RE = re.compile(r"^[A-Z][A-Z0-9_-]{0,15}$")
DEMO_CITIES = ["hyderabad", "kyoto", "lisbon"]


def parse_city(cid):
    """Reads a demo city's raw constants from src/data/cities/<id>.ts (no TypeScript logic is reused)."""
    text = (ROOT / f"src/data/cities/{cid}.ts").read_text()
    order = re.findall(r"'([A-Z_]+)'", text.split("export const PLACE_ORDER = [")[1].split("] as const;")[0])
    places = re.findall(r"\{ id: '(\w+)', name: '[^']*', type: '(attraction|food)', importance: (\d) \}", text)
    hotels = re.findall(r"\{ id: '(H_\w+)', name: '[^']*', stayCost: (\d+) \}", text)
    rows = {h: [int(n) for n in nums.split(",")] for h, nums in re.findall(r"^\s*(H_[A-Z]+):\s*\[([\d,\s]+)\]", text, re.M)}
    budget = int(re.search(r"^\s*budget: (\d+),", text, re.M).group(1))
    inspected = re.search(r"defaultInspectedHotelId: '(\w+)'", text).group(1)
    markers = {k: (int(x), int(y)) for k, x, y in re.findall(r"(\w+): \{ x: (\d+), y: (\d+) \}", text.split("const MARKERS")[1].split("} as const")[0])}
    return order, [(i, t, int(m)) for i, t, m in places], {h: int(c) for h, c in hotels}, rows, budget, inspected, markers


def parse_expected_city(exp, cid):
    m = re.search(rf"^  {cid}: \{{\n(.*?)^  \}},", exp, re.M | re.S)
    if not m:
        return None
    body = m.group(1)
    d = {
        "budget": int(re.search(r"budget: (\d+),", body).group(1)),
        "importanceTotal": int(re.search(r"importanceTotal: (\d+),", body).group(1)),
        "rankOrder": re.findall(r"'(H_\w+)'", re.search(r"rankOrder: \[(.*?)\]", body).group(1)),
        "recommended": re.search(r"recommended: '(\w+)'", body).group(1),
        "mostAccessible": re.search(r"mostAccessible: '(\w+)'", body).group(1),
        "boundaryBudget": int(re.search(r"boundaryBudget: (\d+),", body).group(1)),
    }
    line = re.compile(r"\{ id: '(\w+)', cost: (\d+), total: (\d+), avg: '([\d.]+)', affordable: (true|false), remaining: (-?\d+), rank: (\d+|null) \}")
    d["hotels"] = {x[0]: x for x in line.findall(body)}
    return d


def verify_demo_cities(exp):
    """Shape, story conditions and every documented number for Hyderabad, Kyoto and Lisbon, recomputed from the raw data."""
    out = []
    for cid in DEMO_CITIES:
        def bad(msg, cid=cid):
            out.append(f"{cid}: {msg}")
        order, places, cost, rows, budget, inspected, markers = parse_city(cid)
        pids = [p[0] for p in places]
        imp = {p[0]: p[2] for p in places}
        if not (len(places) == 15 and len(cost) == 10 and len(rows) == 10 and order == pids):
            bad("expected 15 places in PLACE_ORDER order and 10 hotels with 10 rows"); continue
        if not all(ID_RE.match(i) for i in [*pids, *cost]) or len(set([*pids, *cost])) != 25:
            bad("ids must match the engine pattern and be unique across hotels and places")
        if set(cost) != set(rows) or any(len(r) != 15 or not all(1 <= v <= 600 for v in r) for r in rows.values()):
            bad("every hotel needs a row of 15 times in 1..600"); continue
        if not (sum(1 for p in places if p[1] == "attraction") == 8 and sum(1 for p in places if p[1] == "food") == 7):
            bad("expected 8 attractions and 7 food stops")
        if len(set(imp.values())) < 3 or not all(1 <= v <= 5 for v in imp.values()):
            bad("importances must be 1..5 with at least 3 distinct values")
        if set(markers) != set(pids) | set(cost) or not all(0 <= x <= 1000 and 0 <= y <= 640 for x, y in markers.values()):
            bad("markers must cover all 25 ids inside the 1000x640 map")
        if not (0 <= budget <= 1_000_000) or not all(1 <= c <= 1_000_000 for c in cost.values()):
            bad("budget/stay costs out of range")

        itot = sum(imp.values())
        totals = {h: sum(imp[p] * m for p, m in zip(pids, row)) for h, row in rows.items()}

        def rank(b):
            return sorted((h for h in cost if cost[h] <= b), key=lambda h: (totals[h], cost[h], h))

        aff = rank(budget)
        best = min(totals, key=totals.get)
        cheapest = min((h for h in cost if cost[h] <= budget), key=lambda h: cost[h])
        if not (4 <= len(aff) <= 7): bad(f"affordable count {len(aff)} not in 4..7")
        if sorted(totals.values()).count(totals[best]) != 1: bad("most accessible hotel is not unique")
        if cost[best] <= budget: bad("most accessible hotel must be over budget")
        if aff[0] == cheapest: bad("recommended must not be the cheapest affordable")
        if not any(cost[h] == budget for h in cost): bad("one hotel should sit exactly on budget")
        if cost[aff[0]] >= budget: bad("the winner should leave some budget unspent")
        if aff[0] != inspected: bad("default inspected hotel should be the recommendation")
        if not any(max(rows[h]) <= 90 for h in aff): bad("no affordable hotel with all trips <= 90")
        if not any(max(rows[h]) > 90 for h in aff): bad("no affordable hotel with a trip > 90")
        if rank(cost[best])[0] != best: bad("raising the budget to its cost must recommend the most accessible hotel")
        if rank(cost[best] - 1)[0] == best: bad("one unit below its cost must not")
        if rank(0): bad("budget 0 must leave nothing affordable")

        doc = parse_expected_city(exp, cid)
        if doc is None:
            bad("missing from expected.ts"); continue
        if doc["budget"] != budget: bad(f"documented budget {doc['budget']} vs data {budget}")
        if doc["importanceTotal"] != itot: bad(f"documented importance total {doc['importanceTotal']} vs {itot}")
        if doc["rankOrder"] != aff: bad(f"documented rank order {doc['rankOrder']} vs computed {aff}")
        if doc["recommended"] != aff[0]: bad("documented recommendation differs")
        if doc["mostAccessible"] != best or doc["boundaryBudget"] != cost[best]: bad("documented most-accessible hotel / boundary differ")
        if set(doc["hotels"]) != set(cost): bad("expected.ts must document all 10 hotels")
        for h, row in doc["hotels"].items():
            tn = tenths(totals[h], itot)
            avg = f"{tn // 10}.{tn % 10}"
            aff_h = cost[h] <= budget
            r = str(aff.index(h) + 1) if aff_h else "null"
            want = (cost[h], totals[h], avg, aff_h, budget - cost[h], r)
            got = (int(row[1]), int(row[2]), row[3], row[4] == "true", int(row[5]), row[6])
            if want != got: bad(f"{h} documented {got} vs computed {want}")
        print(f"{cid}: budget {budget}, importance total {itot}, recommended {aff[0]} ({totals[aff[0]]}), "
              f"most accessible {best} costs {cost[best]} (over by {cost[best] - budget})")
    return out


def main():
    matrix = read_matrix()
    check(len(matrix) == 10, f"matrix has {len(matrix)} hotels, expected 10")
    check(all(len(r) == 15 for r in matrix.values()), "every row must have 15 values")
    check(all(1 <= v <= 600 for r in matrix.values() for v in r), "travel time out of 1..600")
    check(set(matrix) == set(COST), "matrix hotel ids differ from cost table")
    if failures:
        return failures

    imp_total, totals, order = analyse(matrix, BUDGET, IMPORTANCE)
    full_exp = (ROOT / "src/data/expected.ts").read_text()
    exp = full_exp.split("export const EXPECTED_CITIES")[0]  # Marlowe Bay section only
    check(f"EXPECTED_IMPORTANCE_TOTAL = {imp_total};" in exp, f"importance total {imp_total} not documented")

    line = re.compile(r"\{ id: '(\w+)', cost: (\d+), total: (\d+), avg: '([\d.]+)', affordable: (true|false), "
                      r"remaining: (-?\d+), rank: (\d+|null) \}")
    docs = {m[0]: m for m in line.findall(exp)}
    check(len(docs) == 10, f"expected.ts documents {len(docs)} hotels, expected 10")
    for h in COST:
        d = docs.get(h)
        if not d:
            check(False, f"{h} missing from expected.ts")
            continue
        t = totals[h]
        tn = tenths(t, imp_total)
        avg = f"{tn // 10}.{tn % 10}"
        aff = COST[h] <= BUDGET
        rank = str(order.index(h) + 1) if aff else "null"
        check(int(d[1]) == COST[h], f"{h} cost")
        check(int(d[2]) == t, f"{h} total: doc {d[2]} vs computed {t}")
        check(d[3] == avg, f"{h} avg: doc {d[3]} vs computed {avg}")
        check((d[4] == "true") == aff, f"{h} affordable")
        check(int(d[5]) == BUDGET - COST[h], f"{h} remaining")
        check(d[6] == rank, f"{h} rank: doc {d[6]} vs computed {rank}")

    # Story conditions
    check(4 <= len(order) <= 7, f"affordable count {len(order)} not in 4..7")
    best = min(totals, key=totals.get)
    check(sorted(totals.values()).count(totals[best]) == 1, "most accessible hotel is not unique")
    check(COST[best] > BUDGET, "most accessible hotel must be over budget")
    cheapest = min((h for h in COST if COST[h] <= BUDGET), key=lambda h: COST[h])
    check(order[0] != cheapest, "recommended must not be the cheapest affordable")
    longest = {h: max(matrix[h]) for h in order}
    check(any(v <= 90 for v in longest.values()), "no affordable hotel with all trips <= 90")
    check(any(v > 90 for v in longest.values()), "no affordable hotel with a trip > 90")
    check(analyse(matrix, COST[best], IMPORTANCE)[2][0] == best, "raising budget to its cost must recommend it")
    check(analyse(matrix, COST[best] - 1, IMPORTANCE)[2][0] != best, "one unit below its cost must not")

    # What-if: find every single-place importance change that flips the winner.
    flips = []
    for p in PLACES:
        for v in range(1, 6):
            if v == IMPORTANCE[p]:
                continue
            alt = dict(IMPORTANCE, **{p: v})
            if analyse(matrix, BUDGET, alt)[2][0] != order[0]:
                flips.append((p, v))
    check(("RIVER", 5) in flips, "RIVER=5 must flip the recommendation")
    alt = dict(IMPORTANCE, RIVER=5)
    a_total, a_tot, a_order = analyse(matrix, BUDGET, alt)
    check(a_total == 43, "what-if importance total should be 43")
    check(a_order[0] == "H_RIVERST" and a_order[1] == "H_LANTERN", "what-if order")
    check((a_tot["H_RIVERST"], a_tot["H_LANTERN"]) == (1802, 1812), "what-if totals")
    for token in ("whatIf", "boundaryBudget: 980", "recommended: 'H_LANTERN'", "recommended: 'H_RIVERST'"):
        check(token in exp, f"expected.ts missing {token!r}")

    failures.extend(verify_demo_cities(full_exp))

    print(f"importance total {imp_total}; rank order {order}")
    print(f"most accessible {best} total {totals[best]} cost {COST[best]} (over by {COST[best]-BUDGET})")
    print(f"RIVER flips: {[f for f in flips if f[0]=='RIVER']}")
    return failures


if __name__ == "__main__":
    errs = main()
    if errs:
        print("FAIL:")
        for e in errs:
            print(" -", e)
        sys.exit(1)
    print("OK: all documented answers match the independent calculation")
