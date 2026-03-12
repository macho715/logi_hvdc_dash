import fs from "node:fs/promises";
import path from "node:path";
import { CategoryStats, DocItem, PlanDiffIssue } from "./types";

interface PlanSummary {
  totalDone?: number;
  totalAll?: number;
  categories: Record<string, { done: number; total: number }>;
}

export async function runDiffSyncPlanOnly(
  planPath: string = path.join(process.cwd(), "plan.md")
) {
  const planText = await fs.readFile(planPath, "utf8");

  const items = parsePlanTests(planText);
  const categoryStats = computeCategoryStats(items);
  const issues = diffPlanSummary(planText, categoryStats);
  const report = renderPlanReport(issues);

  process.stdout.write(report);

  return { items, categoryStats, issues, report };
}

// ### Tests 섹션의 체크박스만 파싱
export function parsePlanTests(text: string): DocItem[] {
  const lines = text.split("\n");
  const items: DocItem[] = [];
  let currentCategory = "";
  const sectionStack: string[] = [];
  let inTestsSection = false;

  const checkboxRe = /^- \[( |x)\]\s+(.*)$/;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const title = line.replace(/^##\s+/, "").trim();
      if (title === "Tests") {
        inTestsSection = true;
        currentCategory = "";
        sectionStack.length = 0;
        sectionStack[0] = title;
        continue;
      }
      if (inTestsSection) {
        inTestsSection = false;
        currentCategory = "";
        sectionStack.length = 0;
      }
    }

    if (!inTestsSection) {
      continue;
    }

    if (line.startsWith("#")) {
      const level = line.match(/^#+/)![0].length;
      const title = line.replace(/^#+\s*/, "").trim();
      const relativeLevel = Math.max(1, level - 1);

      sectionStack.splice(relativeLevel - 1);
      sectionStack[relativeLevel - 1] = title;

      if (level === 3) {
        currentCategory = title;
      }
      continue;
    }

    const m = line.match(checkboxRe);
    if (m && currentCategory) {
      const checked = m[1] === "x";
      const textPart = m[2].trim();
      items.push({
        source: "plan",
        category: currentCategory,
        sectionPath: sectionStack.join(" > "),
        text: textPart,
        checked,
      });
    }
  }
  return items;
}

export function computeCategoryStats(items: DocItem[]): CategoryStats[] {
  const map = new Map<string, { done: number; total: number }>();
  for (const it of items) {
    const entry = map.get(it.category) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (it.checked) entry.done += 1;
    map.set(it.category, entry);
  }
  return Array.from(map.entries()).map(([category, { done, total }]) => ({
    category,
    done,
    total,
  }));
}

// Progress Summary에서 총합/카테고리 숫자 추출
function parsePlanSummary(text: string): PlanSummary {
  const lines = text.split("\n");
  const summary: PlanSummary = { categories: {} };

  const totalRe = /\*\*완료된 테스트\*\*:\s*(\d+)개\s*\/\s*(\d+)개/;
  const catRe = /^- \s*[✅⏳]\s+(.+?):\s*(\d+)\/(\d+)\s*\(/;

  for (const line of lines) {
    const totalMatch = line.match(totalRe);
    if (totalMatch) {
      summary.totalDone = Number(totalMatch[1]);
      summary.totalAll = Number(totalMatch[2]);
    }
    const catMatch = line.match(catRe);
    if (catMatch) {
      const category = normalizeCategory(catMatch[1].trim());
      const done = Number(catMatch[2]);
      const total = Number(catMatch[3]);
      summary.categories[category] = { done, total };
    }
  }
  return summary;
}

export function diffPlanSummary(
  text: string,
  categoryStats: CategoryStats[]
): PlanDiffIssue[] {
  const summary = parsePlanSummary(text);
  const issues: PlanDiffIssue[] = [];

  const actualTotal = categoryStats.reduce((acc, c) => acc + c.total, 0);
  const actualDone = categoryStats.reduce((acc, c) => acc + c.done, 0);

  if (
    summary.totalDone !== undefined &&
    summary.totalAll !== undefined &&
    (summary.totalDone !== actualDone || summary.totalAll !== actualTotal)
  ) {
    issues.push({
      kind: "total-tests",
      expectedDone: summary.totalDone,
      expectedTotal: summary.totalAll,
      actualDone,
      actualTotal,
    });
  }

  for (const stat of categoryStats) {
    const expected = summary.categories[normalizeCategory(stat.category)];
    if (!expected) continue;
    if (expected.done !== stat.done || expected.total !== stat.total) {
      issues.push({
        kind: "category",
        category: stat.category,
        expectedDone: expected.done,
        expectedTotal: expected.total,
        actualDone: stat.done,
        actualTotal: stat.total,
      });
    }
  }

  return issues;
}

function normalizeCategory(category: string): string {
  return category
    .replace(/^Supabase\s*↔\s*/i, "")
    .replace(/\s*\(.*\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function renderPlanReport(issues: PlanDiffIssue[]): string {
  if (!issues.length) {
    return "# Doc Intelligence Diff-Sync (plan.md)\n\nNo mismatches found.\n";
  }

  let out = "# Doc Intelligence Diff-Sync (plan.md)\n\n";

  for (const issue of issues) {
    if (issue.kind === "total-tests") {
      out += "## Total tests summary mismatch\n\n";
      out += `- Summary:   ${issue.expectedDone} / ${issue.expectedTotal}\n`;
      out += `- Computed:  ${issue.actualDone} / ${issue.actualTotal}\n\n`;
    } else {
      out += `## Category summary mismatch — ${issue.category}\n\n`;
      out += `- Summary:   ${issue.expectedDone} / ${issue.expectedTotal}\n`;
      out += `- Computed:  ${issue.actualDone} / ${issue.actualTotal}\n\n`;
    }
  }

  return out;
}

if (process.argv[1] && /diffSync\.(t|j)s$/.test(process.argv[1])) {
  runDiffSyncPlanOnly().catch((error) => {
    process.stderr.write(
      `[doc-intelligence] diff-sync failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`
    );
    process.exitCode = 1;
  });
}
