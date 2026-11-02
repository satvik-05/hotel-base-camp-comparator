#!/usr/bin/env python3
"""Independent check of the documented main-scenario answers.

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


def main():
    matrix = read_matrix()
    check(len(matrix) == 10, f"matrix has {len(matrix)} hotels, expected 10")
    check(all(len(r) == 15 for r in matrix.values()), "every row must have 15 values")
    check(all(1 <= v <= 600 for r in matrix.values() for v in r), "travel time out of 1..600")
    check(set(matrix) == set(COST), "matrix hotel ids differ from cost table")
    if failures:
        return failures

    imp_total, totals, order = analyse(matrix, BUDGET, IMPORTANCE)
    exp = (ROOT / "src/data/expected.ts").read_text()
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
