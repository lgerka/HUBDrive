# HUBDrive Matching Engine

## Description
HUBDrive matching engine: strict matching for notifications + soft scoring for recommendations + human-readable explanations.

## Goal
Implement consistent, testable matching between user filters and vehicles.

There are 2 different modes:
1) **STRICT MATCH** (Notifications)
2) **SOFT MATCH** (Recommendations in "All cars")

Business logic lives in:
- `src/lib/matching/*`

UI only consumes typed outputs.

---

## Data assumptions
- Filter fields: optional/empty = "no restriction". "Неважно" maps to null/empty.
- Vehicle fields normalized.

---

## 1) STRICT MATCH (for notifications)

### Hard requirements (always checked)
- `priceKeyTurnKZT <= filter.budgetMax` (required)
- `brand`: must equal if set
- `model`: must equal if set
- `year`: `>= yearFrom`, `<= yearTo` if set

### Conditional requirements (only if filter explicitly set)
- `bodyTypes`, `engineTypes`, `drivetrain`, `transmission`, `exteriorColors`, `interiorColors`: if non-empty, vehicle must be in list.
- `mileage` / `onlyNew`:
  - if `onlyNew`: mileage must be 0/null
  - else if `mileageMax`: `<= mileageMax`
- `engineVolume`: `>=` from, `<=` to

### Output
- `isMatch`: boolean
- `mismatchReasons`: string[] (internal log)

---

## 2) SOFT MATCH (for recommendations)

### Base gate
- Must pass budget gate (<= budgetMax)
- Must be visible (status in stock/transit/reserved/sold; hidden excluded)

### Scoring (0..100)
Recommended weights:
- budget fit: 25 (curve: 70-95% optimal)
- brand: 15
- model: 10
- bodyType: 12
- year: 10
- engineType: 10
- drivetrain: 6
- transmission: 6
- colors: 4
- mileage: 2

Rules:
- Filter not set => neutral (no penalty).
- Match => full weight.
- Mismatch => 0 weight.

### Explanation labels for UI
- **"IDEAL"**: strict match=true OR score >= 90
- **"ALMOST"**: score >= 75 AND only soft mismatches
- **"PARTIAL"**: score >= 55
- otherwise not recommended

Output:
- `matchedFilterTitle`
- `diffSummary` (human readable)

---

## 3) Multi-filter behavior
- Evaluate against all active filters.
- Choose best filter: STRICT > Highest Score.
- UI uses best filter annotation. Notifications use STRICT only.

---

## 4) Anti-spam (notifications)
- Check Storage for existing (type=user, filterId, vehicleId).
- If exists => skip.
- Else create Notification + log Event.
- Statuses allowed: in_stock, in_transit.

---

## 5) Manager triggers

### A: Hot filter created/updated
- `purchasePlan = ready_now` AND (new OR changed critical fields)
- Action: Notify manager (user, summary, link). Log Event.

### B: Hot client match
- `purchasePlan = ready_now` AND STRICT match found
- Action: Notify manager (recommend contact 24h).

### C: User clicked "Contact"
- Action: Notify manager (identity, vehicle, plan). Log Event.

---

## 6) Implementation constraints
- Deterministic, unit-testable.
- `src/lib/matching/strict.ts`, `score.ts`, `explain.ts`.
- Output: `MatchAnnotation { label, title, diffSummary }`.
