import assert from "node:assert/strict";
import test from "node:test";

import { computeCategoryStats, diffPlanSummary, parsePlanTests } from "./diffSync";

const matchingPlan = `
# Dev Plan

## Tests

### Category A (Extra)
- [x] test: a1
- [ ] test: a2

### Category B
- [x] test: b1

## Progress Summary

**완료된 테스트**: 2개 / 3개

### 완료된 카테고리
- ✅ Category A: 1/2 (50%)
- ✅ Category B: 1/1 (100%)
`.trim();

test("diffPlanSummary returns no issues when summary matches", () => {
  const items = parsePlanTests(matchingPlan);
  const stats = computeCategoryStats(items);
  const issues = diffPlanSummary(matchingPlan, stats);
  assert.equal(issues.length, 0);
});

test("diffPlanSummary flags total mismatch", () => {
  const planWithMismatch = matchingPlan.replace(
    "**완료된 테스트**: 2개 / 3개",
    "**완료된 테스트**: 3개 / 3개"
  );
  const items = parsePlanTests(planWithMismatch);
  const stats = computeCategoryStats(items);
  const issues = diffPlanSummary(planWithMismatch, stats);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].kind, "total-tests");
});
